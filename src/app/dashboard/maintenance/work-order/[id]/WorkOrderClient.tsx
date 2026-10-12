'use client'

import { useEffect, useState, useRef } from 'react'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguage } from '@/contexts/LanguageContext'
import { translateStatus, translateMaintenanceType } from '@/lib/data-translation'
import { Building2, Printer, Download, Share2, Loader2, MessageSquare } from 'lucide-react'
import { buildAppUrl } from '@/lib/url'
import { toPng } from 'html-to-image'

interface Request {
  id: string
  requestNumber: string
  trackingCode: string
  issueDescription: string
  priority: string
  createdAt: Date
  requestedDate: Date | null
  requestedTime: string | null
  technicianName: string | null
  technicianPhone: string | null
  notes: string | null
  completionToken: string | null
  completionTokenPlain: string | null
  property: { name: string; neighborhood: string }
  unit: { unitNumber: string }
  type: { name: string }
  status: { name: string }
  assignee: { id: string; name: string } | null
  requesterName: string
  requesterPhone: string
  attachments?: Array<{
    id: string
    fileName: string
    filePath: string
    fileType: string
  }>
}

interface WorkOrderClientProps {
  request: Request
  completionToken: string | null
  companyPhone: string
  companyName: string
}

export default function WorkOrderClient({ request, completionToken, companyPhone, companyName }: WorkOrderClientProps) {
  const { t } = useTranslation()
  const { language, isRTL } = useLanguage()
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [mounted, setMounted] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [feedback, setFeedback] = useState('')
  const workOrderRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && completionToken) {
      // Token already decrypted on server-side, build completion URL directly
      const completionUrl = buildAppUrl(`/complete/${request.trackingCode}?token=${completionToken}`)
      
      import('qrcode').then((QRCodeLib) => {
        QRCodeLib.default.toDataURL(completionUrl, {
          width: 400,
          margin: 1,
          color: {
            dark: '#1e3a5f',
            light: '#ffffff',
          },
        }).then((url) => {
          setQrCodeUrl(url)
        })
      })
    }
  }, [mounted, request.trackingCode, completionToken])

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadPDF = async () => {
    if (!workOrderRef.current) return
    
    setGenerating(true)
    setFeedback('')
    
    try {
      // Generate high-quality PNG from work order
      const dataUrl = await toPng(workOrderRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 794, // 210mm at 96 DPI
        height: 1123, // 297mm at 96 DPI
      })
      
      // Convert to blob and create PDF
      const jsPDF = (await import('jspdf')).default
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })
      
      // Add image to PDF (full page)
      pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297)
      
      // Save PDF
      pdf.save(`work-order-${request.requestNumber}.pdf`)
      
      setFeedback(isRTL ? '✓ تم تحميل PDF' : '✓ PDF downloaded')
      setTimeout(() => setFeedback(''), 3000)
    } catch (error) {
      console.error('Error generating PDF:', error)
      setFeedback(isRTL ? '✗ فشل إنشاء PDF' : '✗ PDF generation failed')
      setTimeout(() => setFeedback(''), 3000)
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadImage = async () => {
    if (!workOrderRef.current) return
    
    setGenerating(true)
    setFeedback('')
    
    try {
      const dataUrl = await toPng(workOrderRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      })
      
      const link = document.createElement('a')
      link.download = `work-order-${request.requestNumber}.png`
      link.href = dataUrl
      link.click()
      
      setFeedback(isRTL ? '✓ تم تحميل الصورة' : '✓ Image downloaded')
      setTimeout(() => setFeedback(''), 3000)
    } catch (error) {
      console.error('Error generating image:', error)
      setFeedback(isRTL ? '✗ فشل التحميل' : '✗ Download failed')
      setTimeout(() => setFeedback(''), 3000)
    } finally {
      setGenerating(false)
    }
  }

  const handleShare = async () => {
    if (!workOrderRef.current) return
    
    setGenerating(true)
    setFeedback('')
    
    try {
      const dataUrl = await toPng(workOrderRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      })
      
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `work-order-${request.requestNumber}.png`, { type: 'image/png' })
      
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: isRTL ? `أمر عمل - ${request.requestNumber}` : `Work Order - ${request.requestNumber}`,
            text: isRTL ? `أمر عمل صيانة رقم ${request.requestNumber}` : `Maintenance Work Order #${request.requestNumber}`,
          })
          setFeedback(isRTL ? '✓ تمت المشاركة' : '✓ Shared successfully')
        } catch (shareError: any) {
          if (shareError.name === 'AbortError') return
          throw shareError
        }
      } else {
        const link = document.createElement('a')
        link.download = `work-order-${request.requestNumber}.png`
        link.href = dataUrl
        link.click()
        setFeedback(isRTL ? '✓ تم تحميل الصورة بنجاح' : '✓ Image downloaded successfully')
      }
      
      setTimeout(() => setFeedback(''), 3000)
    } catch (error) {
      console.error('Error sharing:', error)
      setFeedback(isRTL ? '✗ فشلت المشاركة' : '✗ Share failed')
      setTimeout(() => setFeedback(''), 3000)
    } finally {
      setGenerating(false)
    }
  }

  const handleSendWhatsApp = async () => {
    if (!workOrderRef.current) return
    
    setGenerating(true)
    setFeedback('')
    
    try {
      // Generate high-quality PNG from work order
      const dataUrl = await toPng(workOrderRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: '#ffffff',
        width: 794, // 210mm at 96 DPI
        height: 1123, // 297mm at 96 DPI
      })
      
      // Convert to blob
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `work-order-${request.requestNumber}.png`, { type: 'image/png' })
      
      // Prepare WhatsApp message
      const customerPhone = request.requesterPhone.replace(/[^0-9]/g, '')
      const message = isRTL
        ? `🔧 *أمر عمل صيانة رقم ${request.requestNumber}*\n\nمرفق صورة أمر العمل الكامل`
        : `🔧 *Work Order #${request.requestNumber}*\n\nWork order image attached`
      
      // Try to share with file using Web Share API
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: isRTL ? `أمر عمل - ${request.requestNumber}` : `Work Order - ${request.requestNumber}`,
            text: message,
          })
          setFeedback(isRTL ? '✓ تمت مشاركة أمر العمل' : '✓ Work order shared')
          setTimeout(() => setFeedback(''), 3000)
        } catch (shareError: any) {
          if (shareError.name === 'AbortError') {
            setGenerating(false)
            return
          }
          throw shareError
        }
      } else {
        // Fallback: Download image and open WhatsApp
        const link = document.createElement('a')
        link.download = `work-order-${request.requestNumber}.png`
        link.href = dataUrl
        link.click()
        
        // Open WhatsApp chat with customer
        const whatsappUrl = `https://wa.me/${customerPhone}?text=${encodeURIComponent(message)}`
        
        setTimeout(() => {
          window.open(whatsappUrl, '_blank')
          setFeedback(isRTL 
            ? '✓ تم تحميل الصورة وفتح واتساب - يرجى إرفاق الصورة يدوياً' 
            : '✓ Image downloaded & WhatsApp opened - Please attach manually')
        }, 500)
        
        setTimeout(() => setFeedback(''), 5000)
      }
    } catch (error) {
      console.error('Error sending work order via WhatsApp:', error)
      setFeedback(isRTL ? '✗ فشل إرسال أمر العمل' : '✗ Failed to send work order')
      setTimeout(() => setFeedback(''), 3000)
    } finally {
      setGenerating(false)
    }
  }

  const formatTime12Hour = (time24: string | null): string => {
    if (!time24) return ''
    
    const [hourStr, minuteStr] = time24.split(':')
    let hour = parseInt(hourStr)
    const minute = minuteStr || '00'
    
    let period = ''
    if (hour >= 12) {
      period = isRTL ? 'مساءً' : 'PM'
      if (hour > 12) hour -= 12
    } else {
      period = isRTL ? 'صباحاً' : 'AM'
      if (hour === 0) hour = 12
    }
    
    return `${hour}:${minute} ${period}`
  }

  const formatDate = (date: Date | null): string => {
    if (!date) return ''
    const d = new Date(date)
    return new Intl.DateTimeFormat(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return '#dc2626'
      case 'normal':
        return '#2563eb'
      case 'low':
        return '#6b7280'
      default:
        return '#6b7280'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return t('maintenance.priorityLevels.urgent')
      case 'normal':
        return t('maintenance.priorityLevels.normal')
      case 'low':
        return t('maintenance.priorityLevels.low')
      default:
        return priority
    }
  }

  if (!mounted) {
    return null
  }

  return (
    <div className="relative">
      {/* Action Buttons Toolbar - Fixed at Top */}
      <div className="no-print fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-white to-slate-50 border-b shadow-md">
        <div className="container mx-auto px-4 py-4" style={{ maxWidth: '1100px' }}>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button 
              onClick={handlePrint} 
              className="btn btn-navy gap-2 shadow-sm transition-all hover:shadow-md px-4 py-2.5"
            >
              <Printer className="h-5 w-5" />
              <span className="hidden sm:inline font-medium">{t('poster.print')}</span>
            </button>

            <button 
              onClick={handleDownloadPDF} 
              className="btn btn-blue gap-2 shadow-sm transition-all hover:shadow-md disabled:opacity-50 px-4 py-2.5"
              disabled={generating}
            >
              {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              <span className="hidden sm:inline font-medium">
                {generating ? (isRTL ? 'جاري الإنشاء...' : 'Generating...') : (isRTL ? 'تحميل PDF' : 'Download PDF')}
              </span>
            </button>

            <button 
              onClick={handleDownloadImage} 
              className="btn btn-green gap-2 shadow-sm transition-all hover:shadow-md disabled:opacity-50 px-4 py-2.5"
              disabled={generating}
            >
              {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
              <span className="hidden sm:inline font-medium">
                {generating ? (isRTL ? 'جاري التحميل...' : 'Downloading...') : (isRTL ? 'تحميل كصورة' : 'Download Image')}
              </span>
            </button>

            <button 
              onClick={handleShare} 
              className="btn btn-purple gap-2 shadow-sm transition-all hover:shadow-md disabled:opacity-50 px-4 py-2.5"
              disabled={generating}
            >
              {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />}
              <span className="hidden sm:inline font-medium">
                {generating ? (isRTL ? 'جاري المشاركة...' : 'Sharing...') : (isRTL ? 'مشاركة' : 'Share')}
              </span>
            </button>

            <button 
              onClick={handleSendWhatsApp} 
              className="btn btn-whatsapp gap-2 shadow-sm transition-all hover:shadow-md disabled:opacity-50 px-4 py-2.5"
              disabled={generating}
            >
              {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
              <span className="hidden sm:inline font-medium">
                {generating ? (isRTL ? 'جاري الإعداد...' : 'Preparing...') : (isRTL ? 'إرسال صورة أمر العمل' : 'Send Work Order Image')}
              </span>
            </button>

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
      <div className={`min-h-screen bg-slate-100 ${isRTL ? 'rtl' : 'ltr'} pt-4 pb-8`} dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="flex justify-center px-4">
          <div className="a4-display-container">
            <div 
              ref={workOrderRef}
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
              <div className="relative z-10 px-[16mm] py-[14mm] h-full flex flex-col">
                
                {/* Header Section */}
                <div className="text-center mb-4">
                  {/* Logo */}
                  <div className="mb-2.5 flex justify-center">
                    <div className="relative">
                      <div className="absolute -inset-1 bg-gradient-to-r from-[#d4af37] to-[#f4d03f] rounded-full"></div>
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8f] shadow-lg border-2 border-[#d4af37]">
                        <Building2 className="h-9 w-9 text-[#d4af37]" strokeWidth={2.5} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Company Name */}
                  <h1 className="text-2xl font-bold text-[#1e3a5f] mb-1.5 leading-tight">
                    {companyName || (isRTL ? 'شركة المساعدية النموذجية للعقارات' : 'AL-MUSAADIYA MODEL REAL ESTATE CO.')}
                  </h1>
                  
                  {/* Ornamental Divider */}
                  <div className="flex items-center justify-center gap-2.5 my-2.5">
                    <div className="h-[2px] w-16 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent"></div>
                    <div className="relative">
                      <div className="h-2.5 w-2.5 rounded-full bg-[#d4af37]"></div>
                      <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-[#1e3a5f] transform scale-50"></div>
                    </div>
                    <div className="h-[2px] w-16 bg-gradient-to-l from-transparent via-[#d4af37] to-transparent"></div>
                  </div>
                  
                  {/* Title */}
                  <div className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8f] text-white py-2.5 px-5 rounded-lg inline-block shadow-md">
                    <p className="text-xl font-bold">{isRTL ? 'أمر عمل صيانة' : 'Maintenance Work Order'}</p>
                  </div>
                </div>

                {/* Request Info Bar */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-gradient-to-br from-slate-50 to-white border-2 border-[#1e3a5f] rounded-lg p-3 text-center">
                    <p className="text-sm text-slate-600 mb-1">{t('maintenance.requestNumber')}</p>
                    <p className="text-lg font-bold text-[#1e3a5f]">{request.requestNumber}</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-white border-2 border-[#1e3a5f] rounded-lg p-3 text-center">
                    <p className="text-sm text-slate-600 mb-1">{t('maintenance.status')}</p>
                    <p className="text-base font-bold text-[#1e3a5f]">{translateStatus(request.status.name, language)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-slate-50 to-white border-2 border-[#1e3a5f] rounded-lg p-3 text-center">
                    <p className="text-sm text-slate-600 mb-1">{t('maintenance.priority')}</p>
                    <p className="text-base font-bold" style={{ color: getPriorityColor(request.priority) }}>
                      {getPriorityLabel(request.priority)}
                    </p>
                  </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-3 gap-3 flex-1">
                  {/* Left and Center Columns - 2/3 width */}
                  <div className="col-span-2 space-y-3">
                    {/* Customer Info */}
                    <div className="bg-gradient-to-br from-blue-50 to-white border-l-4 border-[#2563eb] rounded-lg p-3">
                      <h3 className="text-sm font-bold text-[#1e3a5f] mb-2 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#d4af37]"></div>
                        {t('maintenance.requester')}
                      </h3>
                      <div className="space-y-1.5">
                        <div className="flex gap-2.5 text-sm">
                          <span className="text-slate-600 font-semibold min-w-[50px]">{t('users.name')}:</span>
                          <span className="text-[#1e3a5f] font-bold">{request.requesterName}</span>
                        </div>
                        <div className="flex gap-2.5 text-sm">
                          <span className="text-slate-600 font-semibold min-w-[50px]">{t('users.phone')}:</span>
                          <span className="text-[#1e3a5f] font-bold" dir="ltr">{request.requesterPhone}</span>
                        </div>
                      </div>
                    </div>

                    {/* Property Info */}
                    <div className="bg-gradient-to-br from-green-50 to-white border-l-4 border-[#16a34a] rounded-lg p-3">
                      <h3 className="text-sm font-bold text-[#1e3a5f] mb-2 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#d4af37]"></div>
                        {t('maintenance.propertyInfo')}
                      </h3>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
                        <div className="flex gap-2.5">
                          <span className="text-slate-600 font-semibold">{t('maintenance.property')}:</span>
                          <span className="text-[#1e3a5f] font-bold">{request.property.name}</span>
                        </div>
                        <div className="flex gap-2.5">
                          <span className="text-slate-600 font-semibold">{t('properties.neighborhood')}:</span>
                          <span className="text-[#1e3a5f] font-bold">{request.property.neighborhood}</span>
                        </div>
                        <div className="flex gap-2.5">
                          <span className="text-slate-600 font-semibold">{t('maintenance.unit')}:</span>
                          <span className="text-[#1e3a5f] font-bold">{request.unit.unitNumber}</span>
                        </div>
                        <div className="flex gap-2.5">
                          <span className="text-slate-600 font-semibold">{t('maintenance.maintenanceType')}:</span>
                          <span className="text-[#1e3a5f] font-bold">{translateMaintenanceType(request.type.name, language)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Appointment */}
                    {(request.requestedDate || request.requestedTime) && (
                      <div className="bg-gradient-to-br from-purple-50 to-white border-l-4 border-[#9333ea] rounded-lg p-3">
                        <h3 className="text-sm font-bold text-[#1e3a5f] mb-2 flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#d4af37]"></div>
                          {isRTL ? 'الموعد المطلوب' : 'Requested Appointment'}
                        </h3>
                        <div className="flex gap-5 text-sm">
                          {request.requestedDate && (
                            <div className="flex gap-2.5">
                              <span className="text-slate-600 font-semibold">{t('maintenance.date')}:</span>
                              <span className="text-[#1e3a5f] font-bold">{formatDate(request.requestedDate)}</span>
                            </div>
                          )}
                          {request.requestedTime && (
                            <div className="flex gap-2.5">
                              <span className="text-slate-600 font-semibold">{t('maintenance.time')}:</span>
                              <span className="text-[#1e3a5f] font-bold">{formatTime12Hour(request.requestedTime)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Issue Description */}
                    <div className="bg-gradient-to-br from-red-50 to-white border-l-4 border-[#dc2626] rounded-lg p-3">
                      <h3 className="text-sm font-bold text-[#1e3a5f] mb-2 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-[#d4af37]"></div>
                        {t('maintenance.issue')}
                      </h3>
                      <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {request.issueDescription}
                      </p>
                    </div>

                    {/* Issue Photo */}
                    {request.attachments && request.attachments.length > 0 && (
                      <div className="bg-gradient-to-br from-amber-50 to-white border-l-4 border-[#f59e0b] rounded-lg p-3 break-inside-avoid">
                        <h3 className="text-sm font-bold text-[#1e3a5f] mb-2 flex items-center gap-2">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#d4af37]"></div>
                          {isRTL ? 'صورة المشكلة' : 'Issue Photo'}
                        </h3>
                        <div className="bg-white rounded-lg p-2 text-center border border-slate-200">
                          <img
                            src={request.attachments[0].filePath}
                            alt="Issue"
                            className="max-w-full h-auto rounded"
                            style={{ maxHeight: '50mm', margin: '0 auto', objectFit: 'contain' }}
                            crossOrigin="anonymous"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column - QR Code */}
                  <div className="space-y-3">
                    <div className="bg-gradient-to-br from-[#fef3c7] to-[#fde68a] border-2 border-[#d4af37] rounded-lg p-3 text-center shadow-md sticky top-0">
                      <h3 className="text-sm font-bold text-[#92400e] mb-2.5">
                        {isRTL ? 'إتمام البلاغ' : 'Complete Request'}
                      </h3>
                      {qrCodeUrl ? (
                        <div className="bg-white p-2.5 rounded-lg mb-2.5 border border-[#f59e0b]">
                          <img src={qrCodeUrl} alt="QR" className="w-full h-auto" style={{ maxWidth: '140px', margin: '0 auto' }} />
                        </div>
                      ) : completionToken ? (
                        <div className="bg-white p-2.5 rounded-lg mb-2.5 border border-amber-300 text-xs text-amber-700">
                          {isRTL ? '⏳ جاري تحميل QR Code...' : '⏳ Loading QR Code...'}
                        </div>
                      ) : (
                        <div className="bg-white p-2.5 rounded-lg mb-2.5 border border-gray-300 text-xs text-gray-600">
                          {isRTL ? '⚠️ QR Code غير متاح للبلاغات القديمة' : '⚠️ QR Code not available for old requests'}
                        </div>
                      )}
                      <p className="text-xs text-[#92400e] font-semibold mb-2.5 leading-relaxed">
                        {isRTL ? 'امسح الكود لإتمام البلاغ' : 'Scan to complete'}
                      </p>
                      {companyPhone && (
                        <div className="bg-white rounded-lg p-2.5 border border-[#f59e0b]">
                          <p className="text-xs text-slate-600 mb-1">{isRTL ? 'للاستفسار' : 'Contact'}</p>
                          <p className="text-sm font-bold text-[#1e3a5f]" dir="ltr">{companyPhone}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 pt-2.5 border-t-2 border-[#d4af37] flex justify-between text-xs text-slate-600">
                  <span>{isRTL ? `تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')}` : `Print Date: ${new Date().toLocaleDateString('en-US')}`}</span>
                  <span>© 2024 {companyName || (isRTL ? 'شركة المساعدية' : 'AL-MUSAADIYA CO.')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx global>{`
        .btn {
          display: flex;
          align-items: center;
          border: none;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-navy {
          background: #1e3a5f;
          color: white;
        }

        .btn-navy:hover:not(:disabled) {
          background: #2d5a8f;
        }

        .btn-blue {
          background: #2563eb;
          color: white;
        }

        .btn-blue:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .btn-green {
          background: #16a34a;
          color: white;
        }

        .btn-green:hover:not(:disabled) {
          background: #15803d;
        }

        .btn-purple {
          background: #9333ea;
          color: white;
        }

        .btn-purple:hover:not(:disabled) {
          background: #7e22ce;
        }

        .btn-whatsapp {
          background: #25d366;
          color: white;
        }

        .btn-whatsapp:hover:not(:disabled) {
          background: #20ba5a;
        }

        .a4-display-container {
          max-width: 210mm;
        }

        /* Print Styles - CRITICAL: Print ONLY A4, ONE page */
        @media print {
          /* Hide toolbar and ALL dashboard elements */
          .no-print,
          aside,
          nav,
          header,
          [class*="sidebar"],
          [class*="Sidebar"],
          [class*="header"],
          [class*="Header"],
          [class*="nav"],
          [role="navigation"],
          [role="banner"] {
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
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
          
          /* Prevent breaks in sections */
          .break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
          
          /* Page settings - CRITICAL */
          @page {
            size: 210mm 297mm;
            margin: 0mm;
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
  )
}
