'use client'

import { Settings as SettingsIcon, Link, MessageSquare, Printer } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useEffect, useState } from 'react'
import { getAppUrl, buildAppUrl } from '@/lib/url'
import { useTranslation } from '@/hooks/useTranslation'

type Setting = {
  key: string
  value: string
}

export default function SettingsPage() {
  const { t } = useTranslation()
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
        // Fetch settings with credentials to include cookies
        const settingsRes = await fetch('/api/settings', {
          credentials: 'include'
        })
        
        if (!settingsRes.ok) {
          // Handle specific errors
          if (settingsRes.status === 401) {
            console.error('Authentication required. Redirecting to login...')
            alert('انتهت صلاحية الجلسة. سيتم إعادة التوجيه لتسجيل الدخول.')
            window.location.href = '/login'
            return
          }
          if (settingsRes.status === 403) {
            console.error('Insufficient permissions')
            const errorData = await settingsRes.json().catch(() => ({}))
            console.error('Error details:', errorData)
            alert('عذراً، ليس لديك صلاحية للوصول إلى هذه الصفحة.\n\nيُرجى تسجيل الخروج ثم الدخول مرة أخرى.')
            return
          }
          throw new Error(`HTTP ${settingsRes.status}`)
        }
        
        const settingsData = await settingsRes.json()
        console.log('Settings API Response:', settingsData)
        
        // Validate that settingsData is an array
        if (!Array.isArray(settingsData)) {
          console.error('Settings data is not an array:', settingsData)
          throw new Error('Invalid settings format')
        }
        
        const settingsMap = Object.fromEntries(settingsData.map((s: Setting) => [s.key, s.value]))
        console.log('Settings Map:', settingsMap)
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
      company_name: settings.company_name || t('auth.systemTitle')
    })
    setShowSystemDialog(true)
  }

  const handleEditWhatsApp = () => {
    setWhatsappForm({
      whatsapp_number: settings.whatsapp_number || '',
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
      alert(t('settings.settingsSaved'))
    } catch (error) {
      console.error('Error saving settings:', error)
      alert(t('messages.error'))
    } finally {
      setSaving(false)
    }
  }

  const handleSaveWhatsApp = async () => {
    setSaving(true)
    try {
      console.log('Saving WhatsApp settings:', {
        whatsapp_number: whatsappForm.whatsapp_number,
        whatsapp_enabled: whatsappForm.whatsapp_enabled
      })
      
      // Save whatsapp_number
      const numberRes = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          key: 'whatsapp_number',
          value: whatsappForm.whatsapp_number
        })
      })
      
      console.log('Number save response:', numberRes.status, numberRes.statusText)
      
      if (!numberRes.ok) {
        const errorData = await numberRes.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to save whatsapp_number:', errorData)
        
        // Special handling for permission errors
        if (numberRes.status === 403) {
          alert('انتهت صلاحية الجلسة أو تغيرت الصلاحيات.\n\nيُرجى تسجيل الخروج ثم الدخول مرة أخرى.')
          return
        }
        
        throw new Error(`Failed to save number: ${errorData.error || numberRes.statusText}`)
      }
      
      // Save whatsapp_enabled
      const enabledRes = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          key: 'whatsapp_enabled',
          value: whatsappForm.whatsapp_enabled
        })
      })
      
      console.log('Enabled save response:', enabledRes.status, enabledRes.statusText)
      
      if (!enabledRes.ok) {
        const errorData = await enabledRes.json().catch(() => ({ error: 'Unknown error' }))
        console.error('Failed to save whatsapp_enabled:', errorData)
        
        // Special handling for permission errors
        if (enabledRes.status === 403) {
          alert('انتهت صلاحية الجلسة أو تغيرت الصلاحيات.\n\nيُرجى تسجيل الخروج ثم الدخول مرة أخرى.')
          return
        }
        
        throw new Error(`Failed to save status: ${errorData.error || enabledRes.statusText}`)
      }
      
      console.log('Both settings saved successfully')
      
      // Update local state
      setSettings({
        ...settings,
        whatsapp_number: whatsappForm.whatsapp_number,
        whatsapp_enabled: whatsappForm.whatsapp_enabled
      })
      
      setShowWhatsAppDialog(false)
      alert(t('settings.settingsSaved'))
    } catch (error) {
      console.error('Error saving WhatsApp settings:', error)
      alert(error instanceof Error ? error.message : t('messages.error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t('settings.title')}</h2>
        <p className="text-sm text-muted-foreground">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              {t('settings.systemSettings')}
            </CardTitle>
            <CardDescription>{t('settings.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground">{t('settings.companyName')}</label>
              <p className="mt-1 text-sm text-muted-foreground">
                {settings.company_name || t('auth.systemTitle')}
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground">{t('settings.appUrl')}</label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted/50 px-3 py-2 text-xs">
                  {getAppUrl()}
                </code>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleEditSystem}>
              {t('settings.editSettings')}
            </Button>
          </CardContent>
        </Card>

        {/* WhatsApp Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              {t('settings.whatsappSettings')}
            </CardTitle>
            <CardDescription>{t('settings.whatsappSettings')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground">{t('settings.whatsappNumber')}</label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted/50 px-3 py-2 text-sm" dir="ltr">
                  {settings.whatsapp_number || t('settings.notConfigured')}
                </code>
                <Badge variant={settings.whatsapp_enabled === 'true' ? 'success' : 'secondary'}>
                  {settings.whatsapp_enabled === 'true' ? t('settings.enabled') : t('settings.disabled')}
                </Badge>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground">{t('common.status')}</label>
              <p className="mt-1 text-sm text-muted-foreground">
                {settings.whatsapp_enabled === 'true'
                  ? t('settings.enabled')
                  : t('settings.disabled')}
              </p>
            </div>

            <Button variant="outline" className="w-full" onClick={handleEditWhatsApp}>
              {t('settings.editSettings')}
            </Button>
          </CardContent>
        </Card>

        {/* Public Request URL */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="h-5 w-5" />
              {t('settings.publicRequestUrl')}
            </CardTitle>
            <CardDescription>{t('auth.publicRequest')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-foreground">{t('settings.publicRequestUrl')}</label>
              <div className="mt-1 flex items-center gap-2">
                <code className="flex-1 rounded-md bg-muted/50 px-3 py-2 text-sm">
                  {buildAppUrl('/request')}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(buildAppUrl('/request'))}
                >
                  {t('common.view')}
                </Button>
              </div>
            </div>
            
            <div className="rounded-lg border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-yellow-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-slate-800">{t('poster.printPoster')}</p>
                  <p className="text-xs text-slate-600">{t('poster.printPosterEn')}</p>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  className="gap-2 bg-slate-700 hover:bg-slate-800"
                  onClick={() => window.open('/dashboard/maintenance/print', '_blank')}
                >
                  <Printer className="h-4 w-4" />
                  {t('poster.print')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Settings Modal */}
      {showSystemDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{t('settings.editSettings')}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowSystemDialog(false)}>
                  ✕
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t('settings.companyName')}</label>
                  <input
                    type="text"
                    value={systemForm.company_name}
                    onChange={(e) => setSystemForm({ company_name: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                    placeholder={t('settings.companyName')}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveSystem} disabled={saving} className="flex-1">
                    {saving ? t('common.loading') : t('common.save')}
                  </Button>
                  <Button variant="outline" onClick={() => setShowSystemDialog(false)} className="flex-1">
                    {t('common.cancel')}
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
                <h3 className="text-lg font-bold">{t('settings.editSettings')}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowWhatsAppDialog(false)}>
                  ✕
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t('settings.whatsappNumber')}</label>
                  <input
                    type="text"
                    value={whatsappForm.whatsapp_number}
                    onChange={(e) => setWhatsappForm({ ...whatsappForm, whatsapp_number: e.target.value })}
                    className="mt-1 w-full px-3 py-2 border rounded-md"
                    placeholder="966506539610"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={whatsappForm.whatsapp_enabled === 'true'}
                      onChange={(e) => setWhatsappForm({ ...whatsappForm, whatsapp_enabled: e.target.checked ? 'true' : 'false' })}
                      className="w-4 h-4"
                    />
                    <span className="text-sm font-medium">{t('settings.whatsappEnabled')}</span>
                  </label>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveWhatsApp} disabled={saving} className="flex-1">
                    {saving ? t('common.loading') : t('common.save')}
                  </Button>
                  <Button variant="outline" onClick={() => setShowWhatsAppDialog(false)} className="flex-1">
                    {t('common.cancel')}
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
