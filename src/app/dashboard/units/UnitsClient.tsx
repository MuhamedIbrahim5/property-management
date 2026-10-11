'use client'

import { useState, useRef } from 'react'
import { DoorOpen, Building2, Plus, QrCode, X, Download, Trash2, Share2, Copy, MessageSquare, Printer } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import QRCodeLib from 'qrcode'
import { getAppUrl, buildAppUrl } from '@/lib/url'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguage } from '@/contexts/LanguageContext'
import { useReactToPrint } from 'react-to-print'
import { toPng } from 'html-to-image'
import QRPoster from '@/components/QRPoster'

type Unit = {
  id: string
  unitNumber: string
  status: string
  type: string
  tenantName: string | null
  tenantPhone: string | null
  property: { id: string; name: string }
  _count: { maintenanceRequests: number }
}

type Property = {
  id: string
  name: string
}

export default function UnitsClient({ initialUnits, properties }: { initialUnits: Unit[]; properties: Property[] }) {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [units, setUnits] = useState<Unit[]>(initialUnits)
  const [showDialog, setShowDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [whatsappQR, setWhatsappQR] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
  const [sharing, setSharing] = useState(false)
  const [feedback, setFeedback] = useState('')
  const printRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = useState({
    unitNumber: '',
    propertyId: '',
    type: 'residential' as 'residential' | 'services' | 'office',
    status: 'vacant' as 'vacant' | 'occupied' | 'maintenance',
    tenantName: '',
    tenantPhone: ''
  })

  const statusVariant = (status: string) => {
    switch (status) {
      case 'occupied': return 'success'
      case 'vacant': return 'secondary'
      case 'maintenance': return 'warning'
      default: return 'default'
    }
  }

  const statusText = (status: string) => {
    switch (status) {
      case 'occupied': return t('units.unitStatus.occupied')
      case 'vacant': return t('units.unitStatus.vacant')
      case 'maintenance': return t('units.unitStatus.maintenance')
      default: return status
    }
  }

  const typeText = (type: string) => {
    switch (type) {
      case 'residential': return t('units.unitType.residential')
      case 'services': return t('units.unitType.services')
      case 'office': return t('units.unitType.office')
      default: return type
    }
  }

  const handleAdd = () => {
    setEditingUnit(null)
    setFormData({
      unitNumber: '',
      propertyId: properties[0]?.id || '',
      type: 'residential',
      status: 'vacant',
      tenantName: '',
      tenantPhone: ''
    })
    setShowDialog(true)
  }

  const handleEdit = (unit: Unit) => {
    setEditingUnit(unit)
    setFormData({
      unitNumber: unit.unitNumber,
      propertyId: unit.property.id,
      type: unit.type as any,
      status: unit.status as any,
      tenantName: unit.tenantName || '',
      tenantPhone: unit.tenantPhone || ''
    })
    setShowDialog(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingUnit) {
        const res = await fetch(`/api/units/${editingUnit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (!res.ok) throw new Error('Failed to update')
        const updated = await res.json()
        setUnits(units => units.map(u => u.id === updated.id ? {
          ...updated,
          property: properties.find(p => p.id === updated.propertyId) || u.property,
          _count: u._count
        } : u))
      } else {
        const res = await fetch('/api/units', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })
        if (!res.ok) throw new Error('Failed to create')
        const newUnit = await res.json()
        setUnits(units => [{
          ...newUnit,
          property: properties.find(p => p.id === newUnit.propertyId)!,
          _count: { maintenanceRequests: 0 }
        }, ...units])
      }
      setShowDialog(false)
    } catch (error) {
      console.error('Error saving unit:', error)
      alert(t('messages.error'))
    }
  }

  const handleShowQR = async (unit: Unit) => {
    setSelectedUnit(unit)
    const qrUrl = buildAppUrl(`/request?unitId=${unit.id}`)
    
    // Get WhatsApp number from public settings
    const settingsRes = await fetch('/api/public/settings')
    const settingsData = await settingsRes.json()
    const settings = Object.fromEntries(settingsData.map((s: any) => [s.key, s.value]))
    const whatsappNum = settings.whatsapp_number || ''
    setWhatsappNumber(whatsappNum)
    
    const whatsappUrl = whatsappNum ? `https://wa.me/${whatsappNum}` : ''
    
    try {
      // Generate maintenance QR
      const dataUrl = await QRCodeLib.toDataURL(qrUrl, { width: 300, margin: 2 })
      setQrDataUrl(dataUrl)
      
      // Generate WhatsApp QR if number is available
      if (whatsappUrl) {
        const whatsappQRUrl = await QRCodeLib.toDataURL(whatsappUrl, { width: 300, margin: 2 })
        setWhatsappQR(whatsappQRUrl)
      } else {
        setWhatsappQR('')
      }
      
      setShowQRDialog(true)
    } catch (error) {
      console.error('Error generating QR:', error)
      alert(t('messages.error'))
    }
  }

  const handleDelete = (unit: Unit) => {
    setDeletingUnit(unit)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingUnit) return
    
    try {
      const res = await fetch(`/api/units/${deletingUnit.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete')
      }
      setUnits(units => units.filter(u => u.id !== deletingUnit.id))
      setShowDeleteDialog(false)
      setDeletingUnit(null)
    } catch (error: any) {
      console.error('Error deleting unit:', error)
      alert(error.message || t('messages.error'))
    }
  }

  const handleDownloadQR = () => {
    const link = document.createElement('a')
    link.download = `qr-${selectedUnit?.unitNumber}.png`
    link.href = qrDataUrl
    link.click()
  }

  const handleCopyLink = () => {
    const url = buildAppUrl(`/request?unitId=${selectedUnit?.id}`)
    navigator.clipboard.writeText(url)
    alert(t('settings.copyUrl'))
  }

  const handleShareWhatsApp = () => {
    const url = buildAppUrl(`/request?unitId=${selectedUnit?.id}`)
    const message = t('units.whatsappMessage')
      .replace('{property}', selectedUnit?.property.name || '')
      .replace('{unit}', selectedUnit?.unitNumber || '')
      .replace('{url}', url)
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handlePrintPoster = useReactToPrint({
    contentRef: printRef,
    documentTitle: `QR-Poster-${selectedUnit?.unitNumber}`,
  })

  const handleSharePoster = async () => {
    if (!printRef.current) return
    
    setSharing(true)
    setFeedback('')
    
    try {
      // Generate PNG from A4 poster
      const dataUrl = await toPng(printRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 794,  // 210mm at 96 DPI
        height: 1123, // 297mm at 96 DPI
      })
      
      // Convert to blob and file
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `unit-qr-${selectedUnit?.unitNumber}.png`, { type: 'image/png' })
      
      // Check if Web Share API supports files
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `QR Code - ${selectedUnit?.property.name} - ${t('units.unit')} ${selectedUnit?.unitNumber}`,
            text: t('units.shareText') || (language === 'ar' ? 'رمز QR للوحدة' : 'Unit QR Code')
          })
          setFeedback(language === 'ar' ? '✓ تمت المشاركة' : '✓ Shared successfully')
        } catch (shareError: any) {
          // User cancelled the share dialog
          if (shareError.name === 'AbortError') {
            // Don't show error for user cancellation
            return
          }
          throw shareError
        }
      } else {
        // Fallback: Download the image
        const link = document.createElement('a')
        link.download = `unit-qr-${selectedUnit?.unitNumber}-${Date.now()}.png`
        link.href = dataUrl
        link.click()
        setFeedback(language === 'ar' ? '✓ تم تحميل الصورة بنجاح' : '✓ Image downloaded successfully')
      }
      
      setTimeout(() => setFeedback(''), 3000)
    } catch (error: any) {
      console.error('Error sharing:', error)
      setFeedback(language === 'ar' ? '✗ فشلت المشاركة' : '✗ Share failed')
      setTimeout(() => setFeedback(''), 3000)
    } finally {
      setSharing(false)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{t('units.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('units.subtitle')} ({units.length} {t('units.title')})
            </p>
          </div>
          <Button className="gap-2" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            {t('units.newUnit')}
          </Button>
        </div>

        {units.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <DoorOpen className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">{t('units.noUnits')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{t('units.subtitle')}</p>
              <Button className="mt-4 gap-2" onClick={handleAdd}>
                <Plus className="h-4 w-4" />
                {t('units.newUnit')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {units.map((unit) => (
              <Card key={unit.id} className="hover:shadow-lg transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">{unit.unitNumber}</h3>
                        <Badge variant={statusVariant(unit.status)}>{statusText(unit.status)}</Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <Building2 className="h-4 w-4" />
                        <span>{unit.property.name}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{typeText(unit.type)}</p>
                    </div>
                  </div>

                  {unit.tenantName && (
                    <div className="mt-4 rounded-md bg-muted/50 p-3">
                      <p className="text-sm font-semibold text-foreground">{unit.tenantName}</p>
                      {unit.tenantPhone && <p className="text-xs text-muted-foreground">{unit.tenantPhone}</p>}
                    </div>
                  )}

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <div>
                      <p className="text-2xl font-bold text-primary">{unit._count.maintenanceRequests}</p>
                      <p className="text-xs text-muted-foreground">{t('maintenance.title')}</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleShowQR(unit)}>
                      <QrCode className="h-4 w-4" />
                      QR Code
                    </Button>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(unit)}>{t('common.edit')}</Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(unit)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{editingUnit ? t('units.editUnit') : t('units.addUnit')}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t('units.unitNumber')}</label>
                  <Input
                    value={formData.unitNumber}
                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('units.property')}</label>
                  <select
                    value={formData.propertyId}
                    onChange={(e) => setFormData({ ...formData, propertyId: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    {properties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('units.type')}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="residential">{t('units.unitType.residential')}</option>
                    <option value="services">{t('units.unitType.services')}</option>
                    <option value="office">{t('units.unitType.office')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('units.status')}</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="vacant">{t('units.unitStatus.vacant')}</option>
                    <option value="occupied">{t('units.unitStatus.occupied')}</option>
                    <option value="maintenance">{t('units.unitStatus.maintenance')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('units.tenantName')}</label>
                  <Input
                    value={formData.tenantName}
                    onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">{t('units.tenantPhone')}</label>
                  <Input
                    value={formData.tenantPhone}
                    onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">{editingUnit ? t('common.save') : t('common.add')}</Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>{t('common.cancel')}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {showQRDialog && selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">QR Code - {selectedUnit.unitNumber}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowQRDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-col items-center space-y-4">
                <img src={qrDataUrl} alt="QR Code" className="w-64 h-64 border rounded-lg" />
                <p className="text-sm text-center text-muted-foreground">
                  {t('units.scanQR')}
                </p>
                
                <div className="w-full rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-medium mb-1">{t('units.directLink')}</p>
                  <code className="text-xs break-all block">
                    {buildAppUrl(`/request?unitId=${selectedUnit.id}`)}
                  </code>
                </div>

                <div className="w-full grid grid-cols-3 gap-2">
                  <Button size="sm" className="gap-2" onClick={handleDownloadQR}>
                    <Download className="h-4 w-4" />
                    {t('common.download')}
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                    {t('units.copyLink')}
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2" onClick={handleShareWhatsApp}>
                    <MessageSquare className="h-4 w-4" />
                    {t('units.whatsapp')}
                  </Button>
                </div>

                <div className="w-full space-y-2">
                  <Button size="sm" variant="default" className="w-full gap-2 bg-slate-700 hover:bg-slate-800" onClick={handlePrintPoster}>
                    <Printer className="h-4 w-4" />
                    {t('units.printQR')} (A4)
                  </Button>
                  
                  <Button 
                    size="sm" 
                    variant="default" 
                    className="w-full gap-2 bg-purple-600 hover:bg-purple-700" 
                    onClick={handleSharePoster}
                    disabled={sharing}
                  >
                    <Share2 className="h-4 w-4" />
                    {sharing 
                      ? (language === 'ar' ? 'جاري المشاركة...' : 'Sharing...') 
                      : (language === 'ar' ? 'مشاركة صورة A4' : 'Share A4 Image')
                    }
                  </Button>
                  
                  {feedback && (
                    <div className="text-center">
                      <span className="text-sm font-medium text-green-700 px-4 py-2 bg-green-50 rounded-lg border border-green-200 inline-block">
                        {feedback}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hidden Print Component - Use absolute positioning instead of display:none */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }} className="print:static print:left-0 print:top-0">
        <div ref={printRef}>
          {selectedUnit && (
            <QRPoster
              qrDataUrl={qrDataUrl}
              whatsappQR={whatsappQR}
              unitNumber={selectedUnit.unitNumber}
              propertyName={selectedUnit.property.name}
              maintenanceUrl={buildAppUrl(`/request?unitId=${selectedUnit.id}`)}
              whatsappNumber={whatsappNumber}
            />
          )}
        </div>
      </div>

      {showDeleteDialog && deletingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-destructive">{t('messages.deleteConfirm')}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t('units.deleteUnitConfirm')} <strong>{deletingUnit.unitNumber}</strong>?
              </p>
              {deletingUnit._count.maintenanceRequests > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
                  <p className="text-sm text-destructive font-semibold">{t('messages.deleteWarning')}</p>
                  <p className="text-xs text-destructive/80">
                    {t('units.deleteUnitWarning').replace('{count}', String(deletingUnit._count.maintenanceRequests))}
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="destructive" className="flex-1" onClick={confirmDelete}>
                  {t('common.yes')}, {t('common.delete')}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteDialog(false)}>
                  {t('common.cancel')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
