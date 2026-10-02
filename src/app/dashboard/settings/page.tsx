'use client'

import { Settings as SettingsIcon, Wrench, Tag, Link, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'

type MaintenanceStatus = {
  id: string
  name: string
  color: string
  icon: string | null
  order: number
  isActive: boolean
  isDefault: boolean
  isCompleted: boolean
}

type MaintenanceType = {
  id: string
  name: string
  color: string
  isActive: boolean
}

type Setting = {
  key: string
  value: string
}

export default function SettingsPage() {
  const [maintenanceStatuses, setMaintenanceStatuses] = useState<MaintenanceStatus[]>([])
  const [maintenanceTypes, setMaintenanceTypes] = useState<MaintenanceType[]>([])
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [showSystemDialog, setShowSystemDialog] = useState(false)
  const [showWhatsAppDialog, setShowWhatsAppDialog] = useState(false)
  const [systemForm, setSystemForm] = useState({ company_name: '' })
  const [whatsappForm, setWhatsappForm] = useState({ whatsapp_number: '', whatsapp_enabled: 'true' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch statuses
        const statusesRes = await fetch('/api/maintenance/statuses')
        const statusesData = await statusesRes.json()
        setMaintenanceStatuses(statusesData)

        // Fetch types
        const typesRes = await fetch('/api/maintenance/types')
        const typesData = await typesRes.json()
        setMaintenanceTypes(typesData)

        // Fetch settings
        const settingsRes = await fetch('/api/settings')
        const settingsData = await settingsRes.json()
        const settingsMap = Object.fromEntries(settingsData.map((s: Setting) => [s.key, s.value]))
        setSettings(settingsMap)
      } catch (error) {
        console.error('Error fetching settings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleEditSystem = () => {
    setSystemForm({
      company_name: settings.company_name || 'شركة إدارة الأملاك'
    })
    setShowSystemDialog(true)
  }

  const handleEditWhatsApp = () => {
    setWhatsappForm({
      whatsapp_number: settings.whatsapp_number || '966506539610',
      whatsapp_enabled: settings.whatsapp_enabled || 'true'
    })
    setShowWhatsAppDialog(true)
  }

  const handleSaveSystem = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'company_name',
          value: systemForm.company_name
        })
      })
      if (!res.ok) throw new Error('Failed to save')
      
      setSettings({ ...settings, company_name: systemForm.company_name })
      setShowSystemDialog(false)
      alert('تم حفظ الإعدادات بنجاح')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveWhatsApp = async () => {
    setSaving(true)
    try {
      await Promise.all([
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'whatsapp_number',
            value: whatsappForm.whatsapp_number
          })
        }),
        fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'whatsapp_enabled',
            value: whatsappForm.whatsapp_enabled
          })
        })
      ])
      
      setSettings({
        ...settings,
        whatsapp_number: whatsappForm.whatsapp_number,
        whatsapp_enabled: whatsappForm.whatsapp_enabled
      })
      setShowWhatsAppDialog(false)
      alert('تم حفظ إعدادات WhatsApp بنجاح')
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error)
      alert('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">جاري التحميل...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">الإعدادات</h2>
        <p className="text-sm text-muted-foreground">
          إدارة إعدادات النظام والتكوينات
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              إعدادات النظام
            </CardTitle>
            <CardDescription>الإعدادات الأساسية للنظام</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground">اسم الشركة</label>
              <p className="mt-1 text-sm text-muted-foreground">
                {settings.company_name || 'شركة إدارة الأملاك'}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground">رابط النظام</label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted/50 px-3 py-2 text-xs">
                  {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}
                </code>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleEditSystem}>
              تعديل الإعدادات
            </Button>
          </CardContent>
        </Card>

        {/* WhatsApp Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              إعدادات WhatsApp
            </CardTitle>
            <CardDescription>تكوين WhatsApp للنظام</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground">رقم WhatsApp</label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted/50 px-3 py-2 text-sm">
                  {settings.whatsapp_number || '966501234567'}
                </code>
                <Badge variant={settings.whatsapp_enabled === 'true' ? 'success' : 'secondary'}>
                  {settings.whatsapp_enabled === 'true' ? 'مفعّل' : 'معطّل'}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground">حالة التفعيل</label>
              <p className="mt-1 text-sm text-muted-foreground">
                {settings.whatsapp_enabled === 'true'
                  ? 'زر WhatsApp مفعّل في نموذج طلب الصيانة'
                  : 'زر WhatsApp معطّل'}
              </p>
            </div>

            <Button variant="outline" className="w-full" onClick={handleEditWhatsApp}>
              تعديل إعدادات WhatsApp
            </Button>
          </CardContent>
        </Card>

        {/* Public Request URL */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              رابط طلب الصيانة العام
            </CardTitle>
            <CardDescription>رابط نموذج طلب الصيانة للمستأجرين</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground">الرابط العام</label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted/50 px-3 py-2 text-sm">
                  {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/request
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/request`)}
                >
                  نسخ
                </Button>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                يمكن للمستأجرين استخدام هذا الرابط لإرسال طلبات الصيانة بدون تسجيل دخول
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance Statuses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              حالات الصيانة
            </CardTitle>
            <CardDescription>الحالات المتاحة لبلاغات الصيانة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {maintenanceStatuses.map((status) => (
                <div
                  key={status.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted/20 p-3"
                >
                  <div className="flex items-center gap-3">
                    {status.icon && <span className="text-lg">{status.icon}</span>}
                    <div>
                      <p className="text-sm font-semibold text-foreground">{status.name}</p>
                      <div className="mt-1 flex gap-2">
                        {status.isDefault && (
                          <Badge variant="outline" className="text-xs">
                            افتراضي
                          </Badge>
                        )}
                        {status.isCompleted && (
                          <Badge variant="success" className="text-xs">
                            مكتمل
                          </Badge>
                        )}
                        {!status.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            معطّل
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div
                    className="h-4 w-4 rounded-full border-2"
                    style={{ backgroundColor: status.color }}
                  />
                </div>
              ))}
            </div>
            <Button variant="outline" className="mt-4 w-full">
              إدارة الحالات
            </Button>
          </CardContent>
        </Card>

        {/* Maintenance Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              أنواع الصيانة
            </CardTitle>
            <CardDescription>التصنيفات المتاحة لبلاغات الصيانة</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {maintenanceTypes.map((type) => (
                <Badge
                  key={type.id}
                  variant="outline"
                  className="px-3 py-1"
                  style={{
                    borderColor: type.color,
                    color: type.color,
                  }}
                >
                  {type.name}
                </Badge>
              ))}
            </div>
            <Button variant="outline" className="mt-4 w-full">
              إدارة الأنواع
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Settings Modal */}
      {showSystemDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">تعديل إعدادات النظام</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowSystemDialog(false)}>
                  ✕
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">اسم الشركة</label>
                  <input
                    type="text"
                    value={systemForm.company_name}
                    onChange={(e) => setSystemForm({ company_name: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                    placeholder="اسم الشركة"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveSystem} disabled={saving} className="flex-1">
                    {saving ? 'جاري الحفظ...' : 'حفظ'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowSystemDialog(false)} className="flex-1">
                    إلغاء
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* WhatsApp Settings Modal */}
      {showWhatsAppDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">تعديل إعدادات WhatsApp</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowWhatsAppDialog(false)}>
                  ✕
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">رقم WhatsApp</label>
                  <input
                    type="text"
                    value={whatsappForm.whatsapp_number}
                    onChange={(e) => setWhatsappForm({ ...whatsappForm, whatsapp_number: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                    placeholder="966506539610"
                    dir="ltr"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    مثال: 966506539610 (بدون + أو مسافات)
                  </p>
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={whatsappForm.whatsapp_enabled === 'true'}
                      onChange={(e) => setWhatsappForm({ ...whatsappForm, whatsapp_enabled: e.target.checked ? 'true' : 'false' })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">تفعيل WhatsApp</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveWhatsApp} disabled={saving} className="flex-1">
                    {saving ? 'جاري الحفظ...' : 'حفظ'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowWhatsAppDialog(false)} className="flex-1">
                    إلغاء
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
