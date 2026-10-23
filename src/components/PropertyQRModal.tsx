'use client'

import { useState, useEffect, useRef } from 'react'
import { QrCode, Download, Printer, Copy, RefreshCw, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import QRCodeLib from 'qrcode'
import { useLanguage } from '@/contexts/LanguageContext'

interface PropertyQRModalProps {
  propertyId: string
  propertyName: string
  onClose: () => void
}

export default function PropertyQRModal({ propertyId, propertyName, onClose }: PropertyQRModalProps) {
  const { language } = useLanguage()
  const [qrUrl, setQrUrl] = useState('')
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isLocalhost, setIsLocalhost] = useState(false)
  const printRef = useRef<HTMLDivElement>(null)

  const fetchQR = async (regenerate = false) => {
    try {
      const endpoint = `/api/properties/${propertyId}/qr`
      const method = regenerate ? 'PUT' : 'POST'
      
      const res = await fetch(endpoint, { method })
      if (!res.ok) throw new Error('Failed to generate QR')
      
      const data = await res.json()
      setQrUrl(data.qrUrl)
      
      // Check if URL is localhost
      const isLocal = data.qrUrl.includes('localhost') || data.qrUrl.includes('127.0.0.1')
      setIsLocalhost(isLocal)
      
      // Generate QR code image
      const qrImage = await QRCodeLib.toDataURL(data.qrUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })
      setQrDataUrl(qrImage)
    } catch (error) {
      console.error('Error generating QR:', error)
      alert(language === 'ar' ? 'فشل إنشاء رمز QR' : 'Failed to generate QR code')
    } finally {
      setLoading(false)
      setRegenerating(false)
    }
  }

  useEffect(() => {
    fetchQR()
  }, [propertyId])

  const handleRegenerate = async () => {
    if (!confirm(
      language === 'ar' 
        ? 'سيتم إلغاء الرمز القديم. هل تريد المتابعة؟'
        : 'The old QR code will be invalidated. Continue?'
    )) return

    setRegenerating(true)
    await fetchQR(true)
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.download = `${propertyName}-QR.png`
    link.href = qrDataUrl
    link.click()
  }

  const handlePrint = () => {
    window.print()
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p className={language === 'ar' ? 'text-right' : 'text-left'}>
            {language === 'ar' ? 'جاري إنشاء رمز QR...' : 'Generating QR code...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Modal */}
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  {language === 'ar' ? 'رمز زيارات المراقب للعقار' : 'Inspector Visit QR Code'}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {language === 'ar' 
                    ? 'عرض وطباعة رمز تسجيل الزيارات الميدانية' 
                    : 'View and print field visit registration QR code'}
                </p>
              </div>
              <button 
                onClick={onClose} 
                className="text-gray-500 hover:text-gray-700 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* QR Code Display */}
            <div className="text-center">
              <div className="inline-block p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg shadow-inner">
                <img src={qrDataUrl} alt="Inspector Visit QR Code" className="w-64 h-64" />
              </div>
              <div className="mt-4 space-y-1">
                <p className="font-bold text-xl text-foreground">{propertyName}</p>
                <p className="text-sm text-primary font-semibold">
                  {language === 'ar' ? '👷 رمز زيارات المراقبين الميدانية' : '👷 Inspector Field Visit Code'}
                </p>
              </div>
            </div>

            {/* URL Display */}
            <div className="p-4 bg-gray-100 rounded-lg border border-gray-300">
              <p className="text-xs text-gray-600 mb-2 font-semibold">
                {language === 'ar' ? '🔗 رابط صفحة تسجيل الزيارة الميدانية:' : '🔗 Field Visit Registration Link:'}
              </p>
              <p className="text-sm font-mono break-all text-gray-800 bg-white px-3 py-2 rounded border">
                {qrUrl}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {language === 'ar' 
                  ? 'يفتح هذا الرابط صفحة تسجيل الزيارات الميدانية للمراقبين' 
                  : 'This link opens the field visit registration page for workers'}
              </p>
            </div>

            {/* Localhost Warning */}
            {isLocalhost && (
              <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-lg">
                <p className="font-bold text-amber-900 mb-2">
                  ⚠️ {language === 'ar' ? 'تحذير: رابط محلي' : 'Warning: Local URL'}
                </p>
                <p className="text-sm text-amber-800">
                  {language === 'ar' 
                    ? 'هذا الرمز يحتوي على رابط localhost ولن يعمل على الهواتف الميدانية. الرجاء تعيين NEXT_PUBLIC_APP_URL إلى عنوان عام صالح في ملف .env قبل الطباعة أو المشاركة.'
                    : 'This QR code contains a localhost URL and will not work on field devices. Please set NEXT_PUBLIC_APP_URL to a valid public URL in your .env file before printing or sharing.'
                  }
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={handleCopyLink} variant="outline" className="gap-2">
                <Copy className="h-4 w-4" />
                {copied 
                  ? (language === 'ar' ? 'تم النسخ!' : 'Copied!') 
                  : (language === 'ar' ? 'نسخ الرابط' : 'Copy Link')
                }
              </Button>
              
              <Button onClick={handleDownload} variant="outline" className="gap-2" disabled={isLocalhost}>
                <Download className="h-4 w-4" />
                {language === 'ar' ? 'تنزيل PNG' : 'Download PNG'}
              </Button>
              
              <Button onClick={handlePrint} variant="outline" className="gap-2" disabled={isLocalhost}>
                <Printer className="h-4 w-4" />
                {language === 'ar' ? 'طباعة' : 'Print'}
              </Button>
              
              <Button 
                onClick={handleRegenerate} 
                variant="outline" 
                className="gap-2"
                disabled={regenerating}
              >
                <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
                {language === 'ar' ? 'إعادة إصدار' : 'Regenerate'}
              </Button>
            </div>

            {/* Instructions */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm">
              <p className="font-semibold mb-3 text-blue-900 flex items-center gap-2">
                <span>ℹ️</span>
                <span>{language === 'ar' ? 'تعليمات الاستخدام:' : 'Usage Instructions:'}</span>
              </p>
              <ol className={`list-decimal space-y-2 text-blue-800 ${language === 'ar' ? 'pr-5 text-right' : 'pl-5'}`}>
                <li>
                  {language === 'ar' 
                    ? 'اطبع الرمز وألصقه في موقع واضح بمدخل العقار' 
                    : 'Print and place the QR code at the property entrance'}
                </li>
                <li>
                  {language === 'ar' 
                    ? 'عند الوصول للعقار، يمسح المراقب/الفني الرمز من هاتفه' 
                    : 'Upon arrival, inspector/technician scans the code with their phone'}
                </li>
                <li>
                  {language === 'ar' 
                    ? 'يختار بلاغ الصيانة ويسجل ملاحظات الزيارة والصور' 
                    : 'Select maintenance request and record visit notes and photos'}
                </li>
                <li>
                  {language === 'ar' 
                    ? 'يتم تسجيل الموقع الجغرافي تلقائياً لتوثيق الحضور' 
                    : 'GPS location is recorded automatically to verify attendance'}
                </li>
                <li className="font-semibold text-amber-700">
                  {language === 'ar' 
                    ? '⚠️ ملاحظة: يختلف عن رمز QR بلاغات الصيانة الخاص بالمستأجر' 
                    : '⚠️ Note: Different from tenant maintenance request QR'}
                </li>
              </ol>
            </div>

            {/* Distinction Info */}
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs">
              <p className="font-semibold text-amber-900 mb-1">
                {language === 'ar' ? '🔍 الفرق بين الرمزين:' : '🔍 QR Code Types:'}
              </p>
              <div className={`space-y-1 text-amber-800 ${language === 'ar' ? 'text-right' : ''}`}>
                <p>
                  <strong>{language === 'ar' ? '• QR زيارات المراقب (هذا الرمز):' : '• Inspector Visit QR (this code):'}</strong>
                  {' '}
                  {language === 'ar' 
                    ? 'للمراقبين والفنيين - يفتح صفحة تسجيل الزيارات وعرض البلاغات المفتوحة' 
                    : 'For inspectors/technicians - opens visit registration page and shows open requests'}
                </p>
                <p>
                  <strong>{language === 'ar' ? '• QR بلاغات الصيانة (الوحدة):' : '• Maintenance Request QR (Unit):'}</strong>
                  {' '}
                  {language === 'ar' 
                    ? 'للمستأجرين - يفتح نموذج تقديم بلاغ صيانة جديد (موجود في صفحة الوحدات)' 
                    : 'For tenants - opens new maintenance request form (found in Units page)'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Print-only content */}
      <div ref={printRef} className="hidden print:block">
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-content, .print-content * {
              visibility: visible;
            }
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}</style>
        <div className="print-content p-8 text-center">
          <h1 className="text-3xl font-bold mb-2">{propertyName}</h1>
          <p className="text-lg text-gray-600 mb-6">
            {language === 'ar' ? 'رمز زيارات المراقبين الميدانية' : 'Inspector Field Visit QR Code'}
          </p>
          <div className="flex justify-center mb-6">
            <img src={qrDataUrl} alt="Inspector Visit QR Code" className="w-64 h-64" />
          </div>
          <div className="mb-6 border-t border-b py-4">
            <p className="text-lg font-bold mb-3 text-primary">
              {language === 'ar' ? '👷 للمراقبين والفنيين فقط' : '👷 For Inspectors & Technicians Only'}
            </p>
            <p className="text-base text-gray-700 leading-relaxed">
              {language === 'ar' 
                ? 'امسح هذا الرمز عند الوصول للعقار لتسجيل زيارتك الميدانية وعرض بلاغات الصيانة المفتوحة. سيتم توثيق موقعك الجغرافي تلقائياً.'
                : 'Scan this code upon arrival to register your field visit and view open maintenance requests. Your GPS location will be recorded automatically.'}
            </p>
          </div>
          <div className="text-xs text-gray-500 border-t pt-4">
            <p className="font-semibold">{language === 'ar' ? 'نظام إدارة الأملاك والصيانة' : 'Property Management System'}</p>
            <p className="mt-2 font-mono text-[10px] break-all text-gray-400">{qrUrl}</p>
            <div className="mt-3 p-2 bg-amber-50 border border-amber-300 rounded text-amber-800">
              <p className="font-semibold">
                {language === 'ar' 
                  ? '⚠️ هذا رمز زيارات المراقب - يختلف عن رمز بلاغات الصيانة للمستأجرين' 
                  : '⚠️ This is an inspector visit code - different from tenant maintenance request code'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
