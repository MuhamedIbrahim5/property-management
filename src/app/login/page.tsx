'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Home, LogIn, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    const email = formData.get('email') as string
    const password = formData.get('password') as string

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch (error) {
      setError('حدث خطأ أثناء تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-3xl shadow-lg">
            🏢
          </div>
          <h1 className="text-3xl font-bold text-foreground">إدارة الأملاك</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            نظام الصيانة والتشغيل
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">تسجيل الدخول</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-bad/20 bg-bad/10 p-3 text-bad">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-foreground">
                  البريد الإلكتروني
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="email@domain.com"
                />
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground">
                    كلمة المرور
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('لاستعادة كلمة المرور، يرجى التواصل مع مدير النظام.')}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <input
                  type="password"
                  name="password"
                  required
                  className="h-10 w-full rounded-lg border border-input bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
              </div>

              <Button type="submit" className="w-full gap-2" disabled={loading}>
                <LogIn className="h-4 w-4" />
                {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button
            variant="link"
            className="gap-2 text-sm"
            onClick={() => router.push('/request')}
          >
            <Home className="h-4 w-4" />
            طلب صيانة (بدون تسجيل دخول)
          </Button>
        </div>
      </div>
    </div>
  )
}
