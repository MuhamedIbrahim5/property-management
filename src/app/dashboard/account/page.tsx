'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { User, Mail, Lock, Phone, Save, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function AccountPage() {
  const { data: session, update } = useSession()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  // Profile form
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const res = await fetch('/api/account')
      const data = await res.json()
      
      if (res.ok) {
        setName(data.name || '')
        setEmail(data.email || '')
        setPhone(data.phone || '')
      }
    } catch (error) {
      console.error('Error fetching user:', error)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'تم تحديث الملف الشخصي بنجاح' })
        // Update session if email changed
        if (data.email !== session?.user?.email) {
          await update()
        }
      } else {
        setMessage({ type: 'error', text: data.error || 'فشل تحديث الملف الشخصي' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء التحديث' })
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Validation
    if (!currentPassword) {
      setMessage({ type: 'error', text: 'كلمة المرور الحالية مطلوبة' })
      setLoading(false)
      return
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل' })
      setLoading(false)
      return
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'كلمة المرور الجديدة غير متطابقة' })
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: 'تم تغيير كلمة المرور بنجاح' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setMessage({ type: 'error', text: data.error || 'فشل تغيير كلمة المرور' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء التحديث' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">حسابي</h2>
        <p className="text-sm text-muted-foreground">إدارة معلومات حسابك</p>
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 rounded-lg border p-4 ${
          message.type === 'success' 
            ? 'border-good/20 bg-good/10 text-good' 
            : 'border-bad/20 bg-bad/10 text-bad'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : (
            <AlertCircle className="h-5 w-5" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              المعلومات الشخصية
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  الاسم <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="اسمك الكامل"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  البريد الإلكتروني <span className="text-destructive">*</span>
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="email@example.com"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  سيتم التحقق من توفر البريد الإلكتروني
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  رقم الجوال
                </label>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="05xxxxxxxx"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full gap-2">
                <Save className="h-4 w-4" />
                {loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              تغيير كلمة المرور
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  كلمة المرور الحالية <span className="text-destructive">*</span>
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  كلمة المرور الجديدة <span className="text-destructive">*</span>
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={8}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  8 أحرف على الأقل
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">
                  تأكيد كلمة المرور <span className="text-destructive">*</span>
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full gap-2">
                <Lock className="h-4 w-4" />
                {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Account Info */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات الحساب</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">الدور</p>
              <p className="text-lg font-semibold text-foreground">{session?.user?.role || '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">حالة الحساب</p>
              <p className="text-lg font-semibold text-good">نشط</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
