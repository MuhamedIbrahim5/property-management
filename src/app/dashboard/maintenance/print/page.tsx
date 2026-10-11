'use client'

import { useState, useEffect, useRef } from 'react'
import { Building2, Printer, Download, ExternalLink, Copy, Check, Share2, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguage } from '@/contexts/LanguageContext'
import { buildAppUrl } from '@/lib/url'
import QRCodeLib from 'qrcode'
import { toPng } from 'html-to-image'

export default function MaintenancePosterPage() {
  const { t } = useTranslation()
  const { language } = useLanguage()
  const [maintenanceQR, setMaintenanceQR] = useState('')
  const [whatsappQR, setWhatsappQR] = useState('')
  const [whatsappNumber, setWhatsappNumber] = useState('')
  const [contactInfo, setContactInfo] = useState({
    phoneNumber: '',
    phoneNumber2: '',
    extNumbers: '',
    customerService: '',
    serviceName: ''
  })
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [feedback, setFeedback] = useState('')
  const posterRef = useRef<HTMLDivElement>(null)
  
  const isRTL = language === 'ar'
  const requestUrl = buildAppUrl('/request')

  useEffect(() => {
    const generateQRCodes = async () => {
      try {
        const settingsRes = await fetch('/api/public/settings')
        const settingsData = await settingsRes.json()
        const settings = Object.fromEntries(settingsData.map((s: any) => [s.key, s.value]))
        const waNumber = settings.whatsapp_number
        
        if (waNumber) {
          setWhatsappNumber(waNumber)
          const whatsappUrl = `https://wa.me/${waNumber}`
          const whatsappQRUrl = await QRCodeLib.toDataURL(whatsappUrl, { 
            width: 500, 
            margin: 1,
            color: { dark: '#1e3a5f', light: '#ffffff' }
          })
          setWhatsappQR(whatsappQRUrl)
        }

        // Set contact info from settings
        setContactInfo({
          phoneNumber: settings.phone_number || '',
          phoneNumber2: settings.phone_number_2 || '',
          extNumbers: settings.ext_numbers || '',
          customerService: settings.customer_service || '',
          serviceName: settings.service_name || ''
        })

        const maintenanceQRUrl = await QRCodeLib.toDataURL(requestUrl, { 
          width: 500, 
          margin: 1,
          color: { dark: '#1e3a5f', light: '#ffffff' }
        })
        setMaintenanceQR(maintenanceQRUrl)
        
        setLoading(false)
      } catch (error) {
        console.error('Error generating QR codes:', error)
        setLoading(false)
      }
    }

    generateQRCodes()
  }, [requestUrl])

  const handlePrint = () => {
    window.print()
  }

  const handleOpenRequest = () => {
    window.open('/request', '_blank')
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(requestUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  const handleDownloadImage = async () => {
    if (!posterRef.current) return
    
    setDownloading(true)
    setFeedback('')
    
    try {
      const dataUrl = await toPng(posterRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      })
      
      const link = document.createElement('a')
      link.download = `maintenance-poster-${Date.now()}.png`
      link.href = dataUrl
      link.click()
      
      setFeedback(isRTL ? '✓ تم تحميل الصورة' : '✓ Image downloaded')
      setTimeout(() => setFeedback(''), 3000)
    } catch (error) {
      console.error('Error generating image:', error)
      setFeedback(isRTL ? '✗ فشل التحميل' : '✗ Download failed')
      setTimeout(() => setFeedback(''), 3000)
    } finally {
      setDownloading(false)
    }
  }

  const handleShare = async () => {
    if (!posterRef.current) return
    
    setSharing(true)
    setFeedback('')
    
    try {
      // Generate PNG from A4 poster
      const dataUrl = await toPng(posterRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      })
      
      // Convert to blob and file
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], 'maintenance-poster.png', { type: 'image/png' })
      
      // Check if Web Share API supports files
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: isRTL ? 'إعلان الصيانة' : 'Maintenance Poster',
            text: isRTL ? 'احجز موعد طلب الصيانة' : 'Book a Maintenance Appointment'
          })
          setFeedback(isRTL ? '✓ تمت المشاركة' : '✓ Shared successfully')
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
        link.download = `maintenance-poster-${Date.now()}.png`
        link.href = dataUrl
        link.click()
        setFeedback(isRTL ? '✓ تم تحميل الصورة بنجاح' : '✓ Image downloaded successfully')
      }
      
      setTimeout(() => setFeedback(''), 3000)
    } catch (error: any) {
      console.error('Error sharing:', error)
      setFeedback(isRTL ? '✗ فشلت المشاركة' : '✗ Share failed')
      setTimeout(() => setFeedback(''), 3000)
    } finally {
      setSharing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">{t('common.loading')}</p>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Action Buttons Toolbar - Fixed at Top */}
      <div className="no-print fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-white to-slate-50 border-b shadow-md">
        <div className="container mx-auto px-4 py-4" style={{ maxWidth: '1100px' }}>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {/* Print Button */}
            <Button 
              variant="default" 
              onClick={handlePrint} 
              className="gap-2 bg-[#1e3a5f] hover:bg-[#2d5a8f] shadow-sm transition-all hover:shadow-md px-4 py-2.5" 
              size="default"
            >
              <Printer className="h-5 w-5" />
              <span className="hidden sm:inline font-medium">{isRTL ? t('poster.print') : t('poster.printEn')}</span>
              <span className="sm:hidden font-medium">{isRTL ? 'طباعة' : 'Print'}</span>
            </Button>

            {/* Download PDF Button */}
            <Button 
              variant="default" 
              onClick={handleDownloadPDF} 
              className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm transition-all hover:shadow-md px-4 py-2.5" 
              size="default"
            >
              <Download className="h-5 w-5" />
              <span className="hidden sm:inline font-medium">{isRTL ? t('poster.downloadPDF') : t('poster.downloadPDFEn')}</span>
              <span className="sm:hidden font-medium">PDF</span>
            </Button>

            {/* Download Image Button */}
            <Button 
              variant="default" 
              onClick={handleDownloadImage} 
              className="gap-2 bg-green-600 hover:bg-green-700 shadow-sm transition-all hover:shadow-md disabled:opacity-50 px-4 py-2.5" 
              size="default"
              disabled={downloading}
            >
              <ImageIcon className="h-5 w-5" />
              <span className="hidden sm:inline font-medium">
                {downloading 
                  ? (isRTL ? 'جاري التحميل...' : 'Downloading...') 
                  : (isRTL ? 'تحميل كصورة' : 'Download Image')}
              </span>
              <span className="sm:hidden font-medium">{isRTL ? 'صورة' : 'Image'}</span>
            </Button>

            {/* Share Button */}
            <Button 
              variant="default" 
              onClick={handleShare} 
              className="gap-2 bg-purple-600 hover:bg-purple-700 shadow-sm transition-all hover:shadow-md disabled:opacity-50 px-4 py-2.5" 
              size="default"
              disabled={sharing}
            >
              <Share2 className="h-5 w-5" />
              <span className="hidden sm:inline font-medium">
                {sharing 
                  ? (isRTL ? 'جاري المشاركة...' : 'Sharing...') 
                  : (isRTL ? 'مشاركة' : 'Share')}
              </span>
              <span className="sm:hidden font-medium">{isRTL ? 'مشاركة' : 'Share'}</span>
            </Button>
            
            {/* Open Form Button */}
            <Button 
              variant="outline" 
              onClick={handleOpenRequest} 
              className="gap-2 border-slate-300 bg-white hover:bg-slate-50 shadow-sm transition-all hover:shadow-md px-4 py-2.5 text-slate-800 hover:!text-slate-900" 
              size="default"
            >
              <ExternalLink className="h-5 w-5 text-slate-800" />
              <span className="hidden md:inline font-medium">{isRTL ? t('poster.openForm') : t('poster.openFormEn')}</span>
              <span className="md:hidden font-medium">{isRTL ? 'فتح' : 'Open'}</span>
            </Button>

            {/* Copy Link Button */}
            <Button 
              variant="outline" 
              onClick={handleCopyLink} 
              className="gap-2 border-slate-300 bg-white hover:bg-slate-50 shadow-sm transition-all hover:shadow-md px-4 py-2.5 text-slate-800 hover:!text-slate-900"
              size="default"
            >
              {copied ? (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="hidden md:inline text-green-600 font-medium">{isRTL ? t('poster.linkCopied') : t('poster.linkCopiedEn')}</span>
                  <span className="md:hidden text-green-600 font-medium">✓</span>
                </>
              ) : (
                <>
                  <Copy className="h-5 w-5 text-slate-800" />
                  <span className="hidden md:inline font-medium text-slate-800">{isRTL ? t('poster.copyRequestLink') : t('poster.copyRequestLinkEn')}</span>
                  <span className="md:hidden font-medium text-slate-800">{isRTL ? 'نسخ' : 'Copy'}</span>
                </>
              )}
            </Button>

            {/* Feedback Message */}
            {feedback && (
              <div className="w-full sm:w-auto flex justify-center mt-2 sm:mt-0">
                <span className="text-sm font-medium text-green-700 px-4 py-2 bg-green-50 rounded-lg border border-green-200 shadow-sm">
                  {feedback}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content with Top Margin */}
      <div className={`min-h-screen bg-slate-100 ${isRTL ? 'rtl' : 'ltr'} pt-24 pb-8`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* A4 Poster Container with Scale for Better Viewing */}
        <div className="flex justify-center px-4">
          <div className="a4-display-container">
            <div 
              ref={posterRef}
              className="a4-page bg-white relative"
              style={{
                width: '210mm',
                height: '297mm',
                fontFamily: isRTL ? 'Tajawal, Arial, sans-serif' : 'Inter, Arial, sans-serif',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
            {/* Premium Border Frame */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Outer Navy Border */}
              <div className="absolute inset-[8mm] border-[3px] border-[#1e3a5f]"></div>
              
              {/* Inner Gold Border */}
              <div className="absolute inset-[12mm] border-[2px] border-[#d4af37]"></div>
              
              {/* Corner Decorations - Top Left */}
              <div className="absolute top-[8mm] left-[8mm] w-[20mm] h-[20mm]">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-[#d4af37]"></div>
                <div className="absolute top-0 left-0 w-[3px] h-full bg-[#d4af37]"></div>
                <div className="absolute top-[4mm] left-[4mm] w-[10mm] h-[10mm] border-t-[2px] border-l-[2px] border-[#1e3a5f]"></div>
                <div className="absolute top-[6mm] left-[6mm] w-[6mm] h-[6mm] border-t-[1px] border-l-[1px] border-[#d4af37]"></div>
              </div>
              
              {/* Corner Decorations - Top Right */}
              <div className="absolute top-[8mm] right-[8mm] w-[20mm] h-[20mm]">
                <div className="absolute top-0 right-0 w-full h-[3px] bg-[#d4af37]"></div>
                <div className="absolute top-0 right-0 w-[3px] h-full bg-[#d4af37]"></div>
                <div className="absolute top-[4mm] right-[4mm] w-[10mm] h-[10mm] border-t-[2px] border-r-[2px] border-[#1e3a5f]"></div>
                <div className="absolute top-[6mm] right-[6mm] w-[6mm] h-[6mm] border-t-[1px] border-r-[1px] border-[#d4af37]"></div>
              </div>
              
              {/* Corner Decorations - Bottom Left */}
              <div className="absolute bottom-[8mm] left-[8mm] w-[20mm] h-[20mm]">
                <div className="absolute bottom-0 left-0 w-full h-[3px] bg-[#d4af37]"></div>
                <div className="absolute bottom-0 left-0 w-[3px] h-full bg-[#d4af37]"></div>
                <div className="absolute bottom-[4mm] left-[4mm] w-[10mm] h-[10mm] border-b-[2px] border-l-[2px] border-[#1e3a5f]"></div>
                <div className="absolute bottom-[6mm] left-[6mm] w-[6mm] h-[6mm] border-b-[1px] border-l-[1px] border-[#d4af37]"></div>
              </div>
              
              {/* Corner Decorations - Bottom Right */}
              <div className="absolute bottom-[8mm] right-[8mm] w-[20mm] h-[20mm]">
                <div className="absolute bottom-0 right-0 w-full h-[3px] bg-[#d4af37]"></div>
                <div className="absolute bottom-0 right-0 w-[3px] h-full bg-[#d4af37]"></div>
                <div className="absolute bottom-[4mm] right-[4mm] w-[10mm] h-[10mm] border-b-[2px] border-r-[2px] border-[#1e3a5f]"></div>
                <div className="absolute bottom-[6mm] right-[6mm] w-[6mm] h-[6mm] border-b-[1px] border-r-[1px] border-[#d4af37]"></div>
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 px-[16mm] py-[14mm] h-full flex flex-col justify-between">
              
              {/* Header Section */}
              <div className="text-center mb-4">
                {/* Logo */}
                <div className="mb-3 flex justify-center">
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] rounded-full"></div>
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] shadow-lg border-2 border-[#d4af37]">
                      <Building2 className="h-9 w-9 text-[#d4af37]" strokeWidth={2.5} />
                    </div>
                  </div>
                </div>
                
                {/* Company Name */}
                <h1 className="text-2xl font-bold text-[#1e3a5f] mb-1.5 leading-tight">
                  {isRTL ? 'شركة تطوير العقارات' : 'Property Development Company'}
                </h1>
                
                {/* Company Name - Secondary (only show in RTL) */}
                {isRTL && (
                  <p className="text-base text-slate-600 mb-2 font-medium">
                    Property Development Company
                  </p>
                )}
                
                {/* Ornamental Divider */}
                <div className="flex items-center justify-center gap-2 my-2.5">
                  <div className="h-[1.5px] w-16 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"></div>
                  <div className="relative">
                    <div className="h-2 w-2 rounded-full bg-[#d4af37]"></div>
                    <div className="absolute inset-0 h-2 w-2 rounded-full bg-[#1e3a5f] transform scale-50"></div>
                  </div>
                  <div className="h-[1.5px] w-16 bg-gradient-to-l from-transparent via-[#d4af37] to-transparent"></div>
                </div>
                
                {/* System Title */}
                <p className="text-sm font-semibold text-slate-700 mb-0.5">
                  {isRTL ? 'نظام إدارة الصيانة والعقارات' : 'Property Maintenance Management System'}
                </p>
                
                {/* System Title - Secondary (only show in RTL) */}
                {isRTL && (
                  <p className="text-xs text-slate-600">
                    Property Maintenance Management System
                  </p>
                )}
              </div>

              {/* Main Title */}
              <div className="text-center mb-4">
                <div className="border-2 border-[#1e3a5f] rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white relative shadow-sm">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                    <div className="bg-white px-2">
                      <div className="h-2 w-2 rounded-full bg-[#d4af37]"></div>
                    </div>
                  </div>
                  
                  {/* Main Title - Primary Language */}
                  <h2 className="text-xl font-bold text-[#1e3a5f] mb-1.5 leading-tight">
                    {isRTL ? 'احجز موعد طلب الصيانة' : 'Book a Maintenance Appointment'}
                  </h2>
                  
                  {/* Secondary Title - Only show in RTL */}
                  {isRTL && (
                    <p className="text-base font-semibold text-slate-700 mb-1">
                      Book a Maintenance Appointment
                    </p>
                  )}
                  
                  {/* Subtitle */}
                  <p className="text-xs text-slate-600 mt-1">
                    {isRTL ? 'امسح رمز QR لإرسال طلب صيانة جديد' : 'Scan the QR code to submit a new maintenance request'}
                  </p>
                </div>
              </div>

              {/* QR Codes Section */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Maintenance QR */}
                <div className="border-2 border-[#1e3a5f] rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white relative shadow-sm">
                  <div className="absolute -top-0.5 -left-0.5 -right-0.5 -bottom-0.5 bg-gradient-to-br from-[#d4af37] to-[#f4d03f] rounded-lg -z-10"></div>
                  <div className="bg-white p-2 rounded-md shadow-sm mb-2 border border-slate-200">
                    <img 
                      src={maintenanceQR} 
                      alt="Maintenance QR" 
                      className="mx-auto"
                      style={{ width: '120px', height: '120px' }}
                    />
                  </div>
                  <p className="text-base font-bold text-center text-[#1e3a5f] mb-1">
                    {isRTL ? 'طلب صيانة' : 'Maintenance Request'}
                  </p>
                  <p className="text-sm text-center text-slate-600 font-medium">
                    {isRTL ? 'امسح للإرسال' : 'Scan to Submit'}
                  </p>
                </div>

                {/* WhatsApp QR */}
                <div className="border-2 border-[#1e3a5f] rounded-lg p-3 bg-gradient-to-br from-slate-50 to-white relative shadow-sm">
                  <div className="absolute -top-0.5 -left-0.5 -right-0.5 -bottom-0.5 bg-gradient-to-br from-[#d4af37] to-[#f4d03f] rounded-lg -z-10"></div>
                  {whatsappQR && whatsappNumber ? (
                    <>
                      <div className="bg-white p-2 rounded-md shadow-sm mb-2 border border-slate-200">
                        <img 
                          src={whatsappQR} 
                          alt="WhatsApp QR" 
                          className="mx-auto"
                          style={{ width: '120px', height: '120px' }}
                        />
                      </div>
                      <p className="text-base font-bold text-center text-[#1e3a5f] mb-1">
                        {isRTL ? 'واتساب' : 'WhatsApp'}
                      </p>
                      <p className="text-sm text-center text-green-700 font-bold" dir="ltr">
                        +{whatsappNumber}
                      </p>
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full min-h-[165px]">
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-500 mb-1">
                          {isRTL ? 'واتساب غير مفعّل' : 'WhatsApp Not Configured'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {isRTL ? 'يرجى الإعداد من لوحة التحكم' : 'Configure in Dashboard Settings'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Steps Section */}
              <div className="mb-4">
                <div className="border-2 border-[#d4af37] rounded-lg p-4 bg-gradient-to-br from-amber-50 to-yellow-50 shadow-sm">
                  <h3 className="text-center text-base font-bold text-[#1e3a5f] mb-3 pb-2 border-b-2 border-[#d4af37]">
                    {isRTL ? 'خطوات إرسال طلب الصيانة' : 'How to Submit a Maintenance Request'}
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    {[
                      { ar: 'امسح رمز QR', en: 'Scan QR Code' },
                      { ar: 'اختر نوع العقار', en: 'Select Property Type' },
                      { ar: 'املأ البيانات المطلوبة', en: 'Fill Required Data' },
                      { ar: 'اختر نوع المشكلة', en: 'Choose Issue Type' },
                      { ar: 'أرفق صور توضيحية', en: 'Attach Photos' },
                      { ar: 'احصل على رقم المتابعة', en: 'Get Tracking Number' }
                    ].map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#d4af37] to-[#f4d03f]"></div>
                          <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] text-sm font-bold text-[#d4af37]">
                            {idx + 1}
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-[#1e3a5f] leading-tight mb-0.5">
                            {isRTL ? step.ar : step.en}
                          </p>
                          {isRTL && (
                            <p className="text-xs text-slate-600 leading-tight">
                              {step.en}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div>
                <div className="border-2 border-[#d4af37] rounded-lg px-4 py-3 bg-gradient-to-br from-slate-50 to-white shadow-sm">
                  <h3 className="text-center text-sm font-bold text-[#1e3a5f] mb-2.5 pb-1.5 border-b border-[#d4af37]">
                    {isRTL ? 'للتواصل والاستفسار' : 'Contact & Inquiries'}
                  </h3>
                  
                  <div className="space-y-2">
                    {/* WhatsApp Contact */}
                    {whatsappNumber && contactInfo.serviceName && (
                      <div className="flex items-center justify-center gap-2 text-sm">
                        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded px-3 py-1.5">
                          <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                          </svg>
                          <span className="font-bold text-green-800 text-xs">
                            {isRTL ? 'جوال' : 'Mobile'} {contactInfo.serviceName}
                          </span>
                          <a 
                            href={`https://wa.me/${whatsappNumber}`}
                            className="font-bold text-green-700 no-print-link text-sm" 
                            dir="ltr"
                          >
                            {whatsappNumber.startsWith('966') ? `0${whatsappNumber.slice(3)}` : whatsappNumber}
                          </a>
                        </div>
                      </div>
                    )}
                    
                    {/* Phone Numbers */}
                    {(contactInfo.phoneNumber || contactInfo.phoneNumber2) && (
                      <div className="flex items-center justify-center gap-2 text-sm flex-wrap">
                        <span className="font-semibold text-slate-700">
                          {isRTL ? 'ت / ص' : 'Tel'}:
                        </span>
                        <div className="flex items-center gap-1.5" dir="ltr">
                          {contactInfo.phoneNumber && (
                            <span className="font-bold text-[#1e3a5f] text-base">{contactInfo.phoneNumber}</span>
                          )}
                          {contactInfo.phoneNumber && contactInfo.phoneNumber2 && (
                            <span className="text-slate-400">-</span>
                          )}
                          {contactInfo.phoneNumber2 && (
                            <span className="font-bold text-[#1e3a5f] text-base">{contactInfo.phoneNumber2}</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Extensions & Customer Service */}
                    <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
                      {contactInfo.customerService && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-600">
                            {isRTL ? 'خدمة العملاء' : 'Customer Service'}:
                          </span>
                          <span className="font-bold text-[#d4af37] bg-slate-100 px-2 py-0.5 rounded text-sm" dir="ltr">
                            {contactInfo.customerService}
                          </span>
                        </div>
                      )}
                      {contactInfo.extNumbers && (
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-600">
                            {isRTL ? 'التحويلات' : 'Ext'}.:
                          </span>
                          <span className="font-bold text-slate-700 text-sm" dir="ltr">
                            {contactInfo.extNumbers}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
          </div>
        </div>

        {/* Display and Print Styles */}
        <style jsx global>{`
          /* Display Styles - Scale A4 for better viewing on screen */
          @media screen {
            .a4-display-container {
              transform: scale(1.3);
              transform-origin: top center;
              margin-bottom: 100px;
            }

            .a4-page {
              box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
            }

            /* Responsive scaling */
            @media (max-width: 1400px) {
              .a4-display-container {
                transform: scale(1.1);
              }
            }

            @media (max-width: 1200px) {
              .a4-display-container {
                transform: scale(1);
              }
            }

            @media (max-width: 900px) {
              .a4-display-container {
                transform: scale(0.85);
                margin-bottom: 50px;
              }
            }

            @media (max-width: 768px) {
              .a4-display-container {
                transform: scale(0.7);
                margin-bottom: 30px;
              }
            }

            @media (max-width: 600px) {
              .a4-display-container {
                transform: scale(0.55);
                margin-bottom: 0;
              }
            }

            @media (max-width: 480px) {
              .a4-display-container {
                transform: scale(0.45);
                margin-bottom: -50px;
              }
            }
          }

          /* Print Styles - CRITICAL: Print ONLY A4, ONE page */
          @media print {
            /* Hide toolbar and non-print elements */
            .no-print,
            aside,
            nav,
            header,
            [class*="sidebar"],
            [class*="header"],
            [class*="nav"] {
              display: none !important;
              visibility: hidden !important;
            }
            
            /* Force html and body to exact A4 size */
            html,
            body {
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              overflow: hidden !important;
              background: white !important;
            }
            
            /* Container for A4 */
            .a4-display-container {
              display: block !important;
              position: fixed !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              transform: none !important;
              overflow: hidden !important;
            }
            
            /* A4 page - exact size, no overflow */
            .a4-page {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              transform: none !important;
              overflow: hidden !important;
              page-break-after: avoid !important;
              page-break-inside: avoid !important;
            }
            
            /* Page settings - CRITICAL */
            @page {
              size: 210mm 297mm;
              margin: 0mm;
            }
            
            /* Force hide dashboard elements */
            aside,
            nav,
            header,
            .no-print,
            [class*="sidebar"],
            [class*="header"],
            [class*="nav"] {
              display: none !important;
              visibility: hidden !important;
              height: 0 !important;
              overflow: hidden !important;
            }
            
            /* Make WhatsApp link appear as normal text in print */
            .no-print-link {
              color: inherit !important;
              text-decoration: none !important;
              pointer-events: none !important;
            }
            
            /* Preserve colors and backgrounds */
            * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
