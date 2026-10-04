'use client'

import { useState } from 'react'
import { DoorOpen, Building2, Plus, QrCode, X, Download, Trash2, Share2, Copy, MessageSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import QRCodeLib from 'qrcode'
import { getAppUrl, buildAppUrl } from '@/lib/url'

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
  const [units, setUnits] = useState<Unit[]>(initialUnits)
  const [showDialog, setShowDialog] = useState(false)
  const [showQRDialog, setShowQRDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [deletingUnit, setDeletingUnit] = useState<Unit | null>(null)
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null)
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
      case 'occupied': return 'مؤجرة'
      case 'vacant': return 'شاغرة'
      case 'maintenance': return 'صيانة'
      default: return status
    }
  }

  const typeText = (type: string) => {
    switch (type) {
      case 'residential': return 'سكنية'
      case 'services': return 'خدمات'
      case 'office': return 'مكتب'
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
      alert('حدث خطأ أثناء الحفظ')
    }
  }

  const handleShowQR = async (unit: Unit) => {
    setSelectedUnit(unit)
    const qrUrl = buildAppUrl(`/request?unitId=${unit.id}`)
    try {
      const dataUrl = await QRCodeLib.toDataURL(qrUrl, { width: 300, margin: 2 })
      setQrDataUrl(dataUrl)
      setShowQRDialog(true)
    } catch (error) {
      console.error('Error generating QR:', error)
      alert('حدث خطأ في توليد QR Code')
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
      alert(error.message || 'حدث خطأ أثناء الحذف')
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
    alert('تم نسخ الرابط')
  }

  const handleShareWhatsApp = () => {
    const url = buildAppUrl(`/request?unitId=${selectedUnit?.id}`)
    const message = `📋 *رابط طلب صيانة*\n\n🏢 *العقار:* ${selectedUnit?.property.name}\n🚪 *الوحدة:* ${selectedUnit?.unitNumber}\n\n🔗 *الرابط:*\n${url}\n\nيمكنك فتح الرابط أو مسح الـ QR Code لإرسال طلب صيانة`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">الوحدات</h2>
            <p className="text-sm text-muted-foreground">
              إدارة الوحدات السكنية والتجارية ({units.length} وحدة)
            </p>
          </div>
          <Button className="gap-2" onClick={handleAdd}>
            <Plus className="h-4 w-4" />
            إضافة وحدة جديدة
          </Button>
        </div>

        {units.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <DoorOpen className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">لا توجد وحدات</h3>
              <p className="mt-2 text-sm text-muted-foreground">ابدأ بإضافة وحدة جديدة للنظام</p>
              <Button className="mt-4 gap-2" onClick={handleAdd}>
                <Plus className="h-4 w-4" />
                إضافة وحدة جديدة
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
                      <p className="text-xs text-muted-foreground">بلاغ صيانة</p>
                    </div>
                    <Button variant="outline" size="sm" className="gap-2" onClick={() => handleShowQR(unit)}>
                      <QrCode className="h-4 w-4" />
                      QR Code
                    </Button>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(unit)}>تعديل</Button>
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
                <h3 className="text-lg font-bold">{editingUnit ? 'تعديل وحدة' : 'إضافة وحدة جديدة'}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">رقم الوحدة</label>
                  <Input
                    value={formData.unitNumber}
                    onChange={(e) => setFormData({ ...formData, unitNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">العقار</label>
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
                  <label className="text-sm font-medium">النوع</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="residential">سكنية</option>
                    <option value="services">خدمات</option>
                    <option value="office">مكتب</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">الحالة</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="vacant">شاغرة</option>
                    <option value="occupied">مؤجرة</option>
                    <option value="maintenance">صيانة</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">اسم المستأجر</label>
                  <Input
                    value={formData.tenantName}
                    onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">رقم هاتف المستأجر</label>
                  <Input
                    value={formData.tenantPhone}
                    onChange={(e) => setFormData({ ...formData, tenantPhone: e.target.value })}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">{editingUnit ? 'تحديث' : 'إضافة'}</Button>
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowDialog(false)}>إلغاء</Button>
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
                  امسح الكود للوصول لنموذج طلب الصيانة
                </p>
                
                <div className="w-full rounded-lg bg-muted/50 p-3">
                  <p className="text-xs font-medium mb-1">الرابط المباشر:</p>
                  <code className="text-xs break-all block">
                    {buildAppUrl(`/request?unitId=${selectedUnit.id}`)}
                  </code>
                </div>

                <div className="w-full grid grid-cols-3 gap-2">
                  <Button size="sm" className="gap-2" onClick={handleDownloadQR}>
                    <Download className="h-4 w-4" />
                    تحميل
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2" onClick={handleCopyLink}>
                    <Copy className="h-4 w-4" />
                    نسخ
                  </Button>
                  <Button size="sm" variant="outline" className="gap-2" onClick={handleShareWhatsApp}>
                    <MessageSquare className="h-4 w-4" />
                    واتساب
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showDeleteDialog && deletingUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-destructive">تأكيد الحذف</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                هل أنت متأكد من حذف الوحدة <strong>{deletingUnit.unitNumber}</strong>؟
              </p>
              {deletingUnit._count.maintenanceRequests > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3 mb-4">
                  <p className="text-sm text-destructive font-semibold">تحذير:</p>
                  <p className="text-xs text-destructive/80">
                    الوحدة تحتوي على {deletingUnit._count.maintenanceRequests} بلاغ صيانة
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button variant="destructive" className="flex-1" onClick={confirmDelete}>
                  نعم، احذف
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setShowDeleteDialog(false)}>
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
