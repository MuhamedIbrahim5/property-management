'use client'

import { useState, useMemo, useEffect } from 'react'
import { Wrench, Plus, Search, Filter, X, Trash2, FileText } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/hooks/useTranslation'
import { useLanguage } from '@/contexts/LanguageContext'
import { 
  translateStatus, 
  translateMaintenanceType,
  getLocalizedPropertyNameWithId,
  getLocalizedUnitNumberWithId,
  getLocalizedIssueDescription,
  getLocalizedRequesterName,
  getLocalizedNotes
} from '@/lib/data-translation'
import { cn } from '@/lib/utils'
import FieldVisitsSection from '@/components/FieldVisitsSection'

type Request = {
  id: string
  requestNumber: string
  issueDescription: string
  priority: string
  createdAt: Date
  property: { id: string; name: string; nameEn?: string | null; latitude?: number | null; longitude?: number | null }
  unit: { id: string; unitNumber: string; unitNumberEn?: string | null }
  type: { name: string; id: string }
  status: { name: string; id: string }
  assignee: { id: string; name: string } | null
  requesterName?: string | null
  notes?: string | null
  attachments?: Array<{
    id: string
    fileName: string
    filePath: string
    fileType: string
    createdAt: Date
  }>
}

// Helper component to display translated property name
function PropertyName({ property, language }: { property: { id: string; name: string; nameEn?: string | null }; language: 'ar' | 'en' }) {
  const [displayName, setDisplayName] = useState(property.name)
  
  useEffect(() => {
    getLocalizedPropertyNameWithId(property.id, property.name, property.nameEn, language)
      .then(setDisplayName)
      .catch(() => setDisplayName(property.name))
  }, [property, language])
  
  return <>{displayName}</>
}

// Helper component to display translated unit number
function UnitNumber({ unit, language }: { unit: { id: string; unitNumber: string; unitNumberEn?: string | null }; language: 'ar' | 'en' }) {
  const [displayName, setDisplayName] = useState(unit.unitNumber)
  
  useEffect(() => {
    getLocalizedUnitNumberWithId(unit.id, unit.unitNumber, unit.unitNumberEn, language)
      .then(setDisplayName)
      .catch(() => setDisplayName(unit.unitNumber))
  }, [unit, language])
  
  return <>{displayName}</>
}

// Helper component to display translated issue description
function IssueDescription({ description, language }: { description: string; language: 'ar' | 'en' }) {
  const [displayText, setDisplayText] = useState(description)
  
  useEffect(() => {
    getLocalizedIssueDescription(description, language)
      .then(setDisplayText)
      .catch(() => setDisplayText(description))
  }, [description, language])
  
  return <>{displayText}</>
}

// Helper component to display translated requester name
function RequesterName({ name, language }: { name: string; language: 'ar' | 'en' }) {
  const [displayText, setDisplayText] = useState(name)
  
  useEffect(() => {
    if (name) {
      getLocalizedRequesterName(name, language)
        .then(setDisplayText)
        .catch(() => setDisplayText(name))
    }
  }, [name, language])
  
  return <>{displayText}</>
}

// Helper component to display translated technician name
function TechnicianName({ name, language }: { name: string; language: 'ar' | 'en' }) {
  const [displayText, setDisplayText] = useState(name)
  
  useEffect(() => {
    if (name) {
      getLocalizedRequesterName(name, language)  // Reuse same function since it's also a person name
        .then(setDisplayText)
        .catch(() => setDisplayText(name))
    }
  }, [name, language])
  
  return <>{displayText}</>
}

export default function MaintenanceClient({
  initialRequests,
  statuses,
  types,
}: {
  initialRequests: Request[]
  statuses: { id: string; name: string; isCompleted?: boolean }[]
  types: { id: string; name: string }[]
}) {
  const { t } = useTranslation()
  const { language, isRTL } = useLanguage()
  const [requests, setRequests] = useState<Request[]>(initialRequests)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedPriority, setSelectedPriority] = useState('')
  const [selectedTechnician, setSelectedTechnician] = useState('')
  const [showDetailDialog, setShowDetailDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null)
  const [deletingRequest, setDeletingRequest] = useState<Request | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [technicianName, setTechnicianName] = useState('')
  const [technicianPhone, setTechnicianPhone] = useState('')
  
  // Field visit states
  const [showFieldVisitDialog, setShowFieldVisitDialog] = useState(false)
  const [visitNotes, setVisitNotes] = useState('')
  const [visitLocation, setVisitLocation] = useState<{lat: number, lng: number} | null>(null)
  const [locationError, setLocationError] = useState('')
  const [isCapturingLocation, setIsCapturingLocation] = useState(false)
  
  // Attachments states
  const [showAttachmentDialog, setShowAttachmentDialog] = useState(false)
  const [attachmentCategory, setAttachmentCategory] = useState<'before' | 'after' | 'general'>('before')
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null)
  const [attachmentPreview, setAttachmentPreview] = useState<string>('')
  const [requestAttachments, setRequestAttachments] = useState<any[]>([])
  const [fieldVisits, setFieldVisits] = useState<any[]>([])

  // Convert 24-hour time (HH:MM) to 12-hour format with AM/PM
  const formatTime12Hour = (time24: string, rtl: boolean): string => {
    if (!time24) return ''
    
    const [hourStr, minuteStr] = time24.split(':')
    let hour = parseInt(hourStr)
    const minute = minuteStr || '00'
    
    let period = ''
    if (hour >= 12) {
      period = rtl ? 'مساءً' : 'PM'
      if (hour > 12) hour -= 12
    } else {
      period = rtl ? 'صباحاً' : 'AM'
      if (hour === 0) hour = 12
    }
    
    return `${hour}:${minute} ${period}`
  }

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = searchTerm === '' || 
        req.requestNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.issueDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.unit.unitNumber.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = selectedStatus === '' || req.status.id === selectedStatus
      const matchesType = selectedType === '' || req.type.id === selectedType
      const matchesPriority = selectedPriority === '' || req.priority === selectedPriority
      const matchesTechnician = selectedTechnician === '' || 
        (req as any).technicianName?.includes(selectedTechnician) ||
        (req as any).technicianPhone?.includes(selectedTechnician)

      return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesTechnician
    })
  }, [requests, searchTerm, selectedStatus, selectedType, selectedPriority, selectedTechnician])

  const getStatusVariant = (statusName: string) => {
    // Status variant based on common patterns
    // This works with any language since statuses are from database
    const lowerStatus = statusName.toLowerCase()
    if (lowerStatus.includes('complet') || lowerStatus.includes('مكتمل') || lowerStatus.includes('done')) return 'success'
    if (lowerStatus.includes('progress') || lowerStatus.includes('التنفيذ') || lowerStatus.includes('working')) return 'warning'
    if (lowerStatus.includes('cancel') || lowerStatus.includes('ملغي') || lowerStatus.includes('reject')) return 'destructive'
    return 'default'
  }

  const getPriorityVariant = (priority: string) => {
    if (priority === 'urgent') return 'destructive'
    if (priority === 'normal') return 'default'
    return 'secondary'
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'urgent': return t('maintenance.priorityLevels.urgent')
      case 'normal': return t('maintenance.priorityLevels.normal')
      case 'low': return t('maintenance.priorityLevels.low')
      default: return priority
    }
  }

  const handleViewRequest = (req: Request) => {
    console.log('=== Opening Request Details ===')
    console.log('Request Number:', req.requestNumber)
    console.log('Has attachments field:', 'attachments' in req)
    console.log('Attachments:', req.attachments)
    console.log('Attachments count:', req.attachments?.length || 0)
    
    setSelectedRequest(req)
    setNewStatus(req.status.id)
    setTechnicianName((req as any).technicianName || '')
    setTechnicianPhone((req as any).technicianPhone || '')
    
    // Load field visits and attachments
    loadRequestDetails(req.id)
    
    setShowDetailDialog(true)
  }

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return
    
    // Check if the new status is "completed"
    const newStatusObj = statuses.find(s => s.id === newStatus)
    const isCompletedStatus = newStatusObj?.isCompleted || false
    
    // If status is completed, validate requirements
    if (isCompletedStatus) {
      // Check technician name
      if (!technicianName.trim()) {
        alert(t('maintenance.technicianNameRequired') || (isRTL ? 'اسم الفني مطلوب' : 'Technician name is required'))
        return
      }
      
      // Check for completion requirements via API
      try {
        const validationRes = await fetch(`/api/maintenance/${selectedRequest.id}/validate-completion`)
        if (validationRes.ok) {
          const validation = await validationRes.json()
          
          if (!validation.canComplete) {
            const errorMsg = isRTL
              ? `لا يمكن إغلاق البلاغ:\n${validation.validation.errors.map((e: string) => `• ${e}`).join('\n')}`
              : `Cannot complete request:\n${validation.validation.errors.map((e: string) => `• ${e}`).join('\n')}`
            
            alert(errorMsg)
            return
          }
        }
      } catch (error) {
        console.error('Validation check failed:', error)
        // Continue anyway if validation API fails
      }
    }
    
    try {
      const updateData: any = {
        statusId: newStatus,
      }
      
      // Add technician data if status is completed
      if (isCompletedStatus) {
        updateData.technicianName = technicianName.trim()
        updateData.technicianPhone = technicianPhone.trim() || null
      }
      
      const res = await fetch(`/api/maintenance/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update')
      }
      
      const updated = await res.json()
      setRequests(reqs => reqs.map(r => r.id === updated.id ? {
        ...r,
        status: statuses.find(s => s.id === updated.statusId)!,
        technicianName: updated.technicianName,
        technicianPhone: updated.technicianPhone,
      } : r))
      
      setShowDetailDialog(false)
      alert(t('maintenance.updateSuccess'))
    } catch (error: any) {
      console.error('Error updating request:', error)
      alert(error.message || t('maintenance.updateError'))
    }
  }

  const handleDelete = (request: Request) => {
    setDeletingRequest(request)
    setShowDeleteDialog(true)
  }

  const confirmDelete = async () => {
    if (!deletingRequest) return
    
    try {
      const res = await fetch(`/api/maintenance/${deletingRequest.id}`, {
        method: 'DELETE'
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to delete')
      }
      setRequests(reqs => reqs.filter(r => r.id !== deletingRequest.id))
      setShowDeleteDialog(false)
      setDeletingRequest(null)
    } catch (error: any) {
      console.error('Error deleting request:', error)
      alert(error.message || t('maintenance.deleteError'))
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedStatus('')
    setSelectedType('')
    setSelectedPriority('')
    setSelectedTechnician('')
  }

  const captureLocation = () => {
    setIsCapturingLocation(true)
    setLocationError('')
    
    if (!navigator.geolocation) {
      setLocationError(isRTL ? 'المتصفح لا يدعم تحديد الموقع' : 'Geolocation not supported')
      setIsCapturingLocation(false)
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setVisitLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setIsCapturingLocation(false)
      },
      (error) => {
        setLocationError(
          isRTL 
            ? 'تعذر الحصول على الموقع. يرجى التحقق من الأذونات' 
            : 'Failed to get location. Check permissions'
        )
        setIsCapturingLocation(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert(isRTL ? 'يرجى اختيار ملف صورة فقط' : 'Please select an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert(isRTL ? 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت' : 'Image size must be less than 5MB')
      return
    }

    setAttachmentFile(file)
    
    const reader = new FileReader()
    reader.onloadend = () => {
      setAttachmentPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleUploadAttachment = async () => {
    if (!attachmentFile || !selectedRequest) return

    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string

        const response = await fetch(`/api/maintenance/${selectedRequest.id}/attachments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64,
            category: attachmentCategory,
            fileName: attachmentFile.name
          })
        })

        if (!response.ok) throw new Error('Upload failed')

        const newAttachment = await response.json()
        setRequestAttachments(prev => [...prev, newAttachment])
        
        // Reset
        setShowAttachmentDialog(false)
        setAttachmentFile(null)
        setAttachmentPreview('')
        
        alert(isRTL ? 'تم رفع الصورة بنجاح' : 'Image uploaded successfully')
      }
      reader.readAsDataURL(attachmentFile)
    } catch (error) {
      console.error('Upload error:', error)
      alert(isRTL ? 'فشل رفع الصورة' : 'Failed to upload image')
    }
  }

  const handleCreateFieldVisit = async () => {
    if (!selectedRequest || !visitNotes.trim()) {
      alert(isRTL ? 'يرجى إدخال ملاحظات الزيارة' : 'Please enter visit notes')
      return
    }

    try {
      const response = await fetch('/api/maintenance/field-visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          notes: visitNotes,
          latitude: visitLocation?.lat,
          longitude: visitLocation?.lng
        })
      })

      if (!response.ok) throw new Error('Failed to create visit')

      const newVisit = await response.json()
      setFieldVisits(prev => [...prev, newVisit])
      
      // Reset
      setShowFieldVisitDialog(false)
      setVisitNotes('')
      setVisitLocation(null)
      setLocationError('')
      
      alert(isRTL ? 'تم تسجيل الزيارة بنجاح' : 'Field visit recorded successfully')
    } catch (error) {
      console.error('Visit creation error:', error)
      alert(isRTL ? 'فشل تسجيل الزيارة' : 'Failed to record visit')
    }
  }

  const loadRequestDetails = async (requestId: string) => {
    try {
      // Load attachments
      const attachRes = await fetch(`/api/maintenance/${requestId}/attachments`)
      if (attachRes.ok) {
        const attachments = await attachRes.json()
        setRequestAttachments(attachments)
      }

      // Load field visits
      const visitsRes = await fetch(`/api/maintenance/field-visits?requestId=${requestId}`)
      if (visitsRes.ok) {
        const visits = await visitsRes.json()
        setFieldVisits(visits)
      }
    } catch (error) {
      console.error('Error loading details:', error)
    }
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{t('maintenance.title')}</h2>
            <p className="text-sm text-muted-foreground">
              {t('maintenance.subtitle')} ({filteredRequests.length} {t('maintenance.requestCount').replace('{count}', '')})
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t('maintenance.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-10 w-full rounded-lg border border-input bg-white pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4" />
                {t('maintenance.filters')}
              </Button>
              {(selectedStatus || selectedType || selectedPriority || selectedTechnician) && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {showFilters && (
              <div className="mt-4 grid grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-medium">{t('maintenance.status')}</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">{t('common.all')}</option>
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>
                        {translateStatus(s.name, language)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">{t('maintenance.type')}</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">{t('common.all')}</option>
                    {types.map(type => (
                      <option key={type.id} value={type.id}>
                        {translateMaintenanceType(type.name, language)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">{t('maintenance.priority')}</label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">{t('common.all')}</option>
                    <option value="low">{t('maintenance.priorityLevels.low')}</option>
                    <option value="normal">{t('maintenance.priorityLevels.normal')}</option>
                    <option value="urgent">{t('maintenance.priorityLevels.urgent')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">{t('maintenance.technician')}</label>
                  <input
                    type="text"
                    value={selectedTechnician}
                    onChange={(e) => setSelectedTechnician(e.target.value)}
                    placeholder={t('maintenance.technicianPlaceholder')}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Wrench className="h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">{t('maintenance.noRequests')}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchTerm || selectedStatus || selectedType || selectedPriority
                  ? t('maintenance.noSearchResults')
                  : t('maintenance.noRequestsYet')}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/30">
                    <tr className="border-b border-border">
                      <th className={cn("px-3 py-3 text-xs font-bold whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                        {t('maintenance.requestNumber')}
                      </th>
                      <th className={cn("px-3 py-3 text-xs font-bold whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                        {t('maintenance.propertyAndUnit')}
                      </th>
                      <th className={cn("px-3 py-3 text-xs font-bold whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                        {t('maintenance.issue')}
                      </th>
                      <th className={cn("px-3 py-3 text-xs font-bold whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                        {t('maintenance.type')}
                      </th>
                      <th className={cn("px-3 py-3 text-xs font-bold whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                        {t('maintenance.status')}
                      </th>
                      <th className={cn("px-3 py-3 text-xs font-bold whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                        {t('maintenance.priority')}
                      </th>
                      <th className={cn("px-3 py-3 text-xs font-bold whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                        {t('maintenance.technician')}
                      </th>
                      <th className={cn("px-3 py-3 text-xs font-bold whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                        {t('maintenance.dateCreated')}
                      </th>
                      <th className={cn("px-3 py-3 text-xs font-bold whitespace-nowrap", isRTL ? "text-right" : "text-left")}>
                        {t('common.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-3 py-3">
                          <span className="text-sm font-semibold text-primary whitespace-nowrap">{request.requestNumber}</span>
                        </td>
                        <td className="px-3 py-3">
                          <div>
                            <p className="text-sm font-medium"><PropertyName property={request.property} language={language} /></p>
                            <p className="text-xs text-muted-foreground"><UnitNumber unit={request.unit} language={language} /></p>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <p className="text-sm line-clamp-2 max-w-xs"><IssueDescription description={request.issueDescription} language={language} /></p>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant="outline" className="text-xs whitespace-nowrap">
                            {translateMaintenanceType(request.type.name, language)}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex flex-col gap-1">
                            <Badge variant={getStatusVariant(request.status.name)} className="whitespace-nowrap">
                              {translateStatus(request.status.name, language)}
                            </Badge>
                            {(() => {
                              const daysSinceCreation = Math.floor((Date.now() - new Date(request.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                              const isDelayed = daysSinceCreation > 30 && !statuses.find(s => s.id === request.status.id)?.isCompleted
                              return isDelayed ? (
                                <Badge variant="destructive" className="text-xs whitespace-nowrap">
                                  ⏰ {isRTL ? 'متأخر' : 'Delayed'} ({daysSinceCreation} {isRTL ? 'يوم' : 'days'})
                                </Badge>
                              ) : null
                            })()}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={getPriorityVariant(request.priority)} className="whitespace-nowrap">
                            {getPriorityText(request.priority)}
                          </Badge>
                        </td>
                        <td className="px-3 py-3">
                          {(request as any).technicianName ? (
                            <div>
                              <p className="text-sm font-medium">
                                <TechnicianName name={(request as any).technicianName} language={language} />
                              </p>
                              <p className="text-xs text-muted-foreground">{(request as any).technicianPhone}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-3 py-3">
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {new Date(request.createdAt).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewRequest(request)}>{t('common.view')}</Button>
                            <Button variant="destructive" size="sm" onClick={() => handleDelete(request)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showDetailDialog && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{t('maintenance.requestDetails')} - {selectedRequest.requestNumber}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t('maintenance.issueDescription')}</label>
                  <p className="mt-1 text-sm text-muted-foreground"><IssueDescription description={selectedRequest.issueDescription} language={language} /></p>
                </div>
                
                {/* Display request attachments if any */}
                {(() => {
                  const hasAttachments = selectedRequest.attachments && selectedRequest.attachments.length > 0
                  console.log('=== Attachments Display Check ===')
                  console.log('selectedRequest.attachments:', selectedRequest.attachments)
                  console.log('Is array:', Array.isArray(selectedRequest.attachments))
                  console.log('Length:', selectedRequest.attachments?.length)
                  console.log('Condition result:', hasAttachments)
                  
                  return hasAttachments ? (
                    <div>
                      <label className="text-sm font-medium">{t('maintenance.attachments')}</label>
                      <div className="mt-2 grid grid-cols-2 gap-3">
                        {selectedRequest.attachments!.map((attachment) => {
                          console.log('Rendering attachment:', attachment.fileName)
                          return (
                            <div key={attachment.id} className="relative rounded-lg border overflow-hidden">
                              <img 
                                src={attachment.filePath} 
                                alt={attachment.fileName} 
                                className="w-full h-40 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => window.open(attachment.filePath, '_blank')}
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 truncate">
                                {attachment.fileName}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ) : null
                })()}
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">{t('maintenance.property')}</label>
                    <p className="mt-1 text-sm"><PropertyName property={selectedRequest.property} language={language} /></p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('maintenance.unit')}</label>
                    <p className="mt-1 text-sm"><UnitNumber unit={selectedRequest.unit} language={language} /></p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">{t('maintenance.type')}</label>
                    <p className="mt-1 text-sm">{translateMaintenanceType(selectedRequest.type.name, language)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('maintenance.priority')}</label>
                    <p className="mt-1 text-sm">{getPriorityText(selectedRequest.priority)}</p>
                  </div>
                </div>
                
                {/* Display requested date and time if available */}
                {((selectedRequest as any).requestedDate || (selectedRequest as any).requestedTime) && (
                  <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                    <p className="text-sm font-semibold text-blue-900 mb-2">
                      {isRTL ? '📅 موعد مطلوب' : '📅 Requested Appointment'}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {(selectedRequest as any).requestedDate && (
                        <div>
                          <label className="text-xs font-medium text-blue-700">{t('maintenance.requestedDate')}</label>
                          <p className="mt-1 text-sm text-blue-900">
                            {new Date((selectedRequest as any).requestedDate).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US')}
                          </p>
                        </div>
                      )}
                      {(selectedRequest as any).requestedTime && (
                        <div>
                          <label className="text-xs font-medium text-blue-700">{t('maintenance.requestedTime')}</label>
                          <p className="mt-1 text-sm text-blue-900">
                            {formatTime12Hour((selectedRequest as any).requestedTime, isRTL)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {(selectedRequest as any).technicianName && (
                  <div className="rounded-lg bg-good/10 border border-good/20 p-4">
                    <p className="text-sm font-semibold text-good mb-2">✅ {t('maintenance.completedByTechnician')}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t('maintenance.technicianName')}</label>
                        <p className="mt-1 text-sm">
                          <TechnicianName name={(selectedRequest as any).technicianName} language={language} />
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">{t('maintenance.technicianPhone')}</label>
                        <p className="mt-1 text-sm">{(selectedRequest as any).technicianPhone}</p>
                      </div>
                    </div>
                    {(selectedRequest as any).completionImage && (
                      <div className="mt-3">
                        <label className="text-xs font-medium text-muted-foreground">{t('maintenance.completionImage')}</label>
                        <img 
                          src={(selectedRequest as any).completionImage} 
                          alt="Completion" 
                          className="mt-2 w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                {/* Field Visits Section */}
                <div className="border-t pt-4">
                  <FieldVisitsSection 
                    visits={fieldVisits.map(visit => ({
                      id: visit.id,
                      visitDate: visit.visitDate,
                      latitude: visit.latitude,
                      longitude: visit.longitude,
                      accuracy: visit.accuracy,
                      locationError: visit.locationError,
                      distanceMeters: visit.distanceMeters,
                      notes: visit.notes,
                      attachments: visit.attachments || []
                    }))}
                    property={{
                      latitude: selectedRequest.property.latitude || null,
                      longitude: selectedRequest.property.longitude || null
                    }}
                  />
                </div>
                
                {/* Attachments Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold">{isRTL ? '📎 المرفقات' : '📎 Attachments'}</h4>
                    <Button
                      size="sm"
                      onClick={() => setShowAttachmentDialog(true)}
                      className="text-xs"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      {isRTL ? 'رفع صورة' : 'Upload Image'}
                    </Button>
                  </div>
                  
                  {requestAttachments.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {requestAttachments.map((attachment) => (
                        <div key={attachment.id} className="relative group">
                          <img
                            src={attachment.filePath}
                            alt={attachment.fileName}
                            className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90"
                            onClick={() => window.open(attachment.filePath, '_blank')}
                          />
                          <div className="absolute top-1 left-1">
                            <span className={cn(
                              "text-xs px-2 py-0.5 rounded",
                              attachment.category === 'before' && "bg-red-500 text-white",
                              attachment.category === 'after' && "bg-green-500 text-white",
                              attachment.category === 'general' && "bg-blue-500 text-white"
                            )}>
                              {attachment.category === 'before' && (isRTL ? 'قبل' : 'Before')}
                              {attachment.category === 'after' && (isRTL ? 'بعد' : 'After')}
                              {attachment.category === 'general' && (isRTL ? 'عام' : 'General')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{isRTL ? 'لا توجد مرفقات' : 'No attachments'}</p>
                  )}
                </div>
                
                <div>
                  <label className="text-sm font-medium">{t('maintenance.status')}</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  >
                    {statuses.map(s => (
                      <option key={s.id} value={s.id}>
                        {translateStatus(s.name, language)}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Technician fields - Show when status is "completed" */}
                {(() => {
                  const selectedStatusObj = statuses.find(s => s.id === newStatus)
                  const isCompletedStatus = selectedStatusObj?.isCompleted || false
                  
                  return isCompletedStatus ? (
                    <div className="rounded-lg bg-amber-50 border-2 border-amber-300 p-4 space-y-4">
                      <div className="flex items-center gap-2 text-amber-900">
                        <span className="text-lg">🔧</span>
                        <p className="text-sm font-semibold">
                          {isRTL ? 'بيانات الفني (مطلوبة لإتمام البلاغ)' : 'Technician Information (Required for Completion)'}
                        </p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-amber-900">
                          {isRTL ? 'اسم الفني' : 'Technician Name'} <span className="text-red-600">*</span>
                        </label>
                        <input
                          type="text"
                          value={technicianName}
                          onChange={(e) => setTechnicianName(e.target.value)}
                          placeholder={isRTL ? 'أدخل اسم الفني الذي نفذ الصيانة' : 'Enter technician name'}
                          className="w-full px-3 py-2 border-2 border-amber-300 rounded-md mt-1 focus:border-amber-500 focus:outline-none"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-amber-900">
                          {isRTL ? 'رقم هاتف الفني' : 'Technician Phone'} <span className="text-muted-foreground text-xs">({isRTL ? 'اختياري' : 'Optional'})</span>
                        </label>
                        <input
                          type="tel"
                          value={technicianPhone}
                          onChange={(e) => setTechnicianPhone(e.target.value)}
                          placeholder={isRTL ? 'أدخل رقم هاتف الفني (اختياري)' : 'Enter technician phone (optional)'}
                          className="w-full px-3 py-2 border-2 border-amber-300 rounded-md mt-1 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : null
                })()}
                
                {/* Work Order Button */}
                <div className="pt-4 border-t">
                  <button
                    onClick={() => window.open(`/dashboard/maintenance/work-order/${selectedRequest.id}`, '_blank')}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    {language === 'ar' ? 'إعداد أمر عمل للفني' : 'Prepare Technician Work Order'}
                  </button>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpdateRequest} className="flex-1">{t('maintenance.update')}</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowDetailDialog(false)}>{t('common.cancel')}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Field Visit Dialog */}
      {showFieldVisitDialog && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{isRTL ? 'تسجيل زيارة ميدانية' : 'Record Field Visit'}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowFieldVisitDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">
                    {isRTL ? 'ملاحظات الزيارة' : 'Visit Notes'} <span className="text-red-600">*</span>
                  </label>
                  <textarea
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    placeholder={isRTL ? 'صف ما تم خلال الزيارة...' : 'Describe what happened during the visit...'}
                    className="w-full px-3 py-2 border rounded-md mt-1 min-h-[100px]"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">{isRTL ? 'الموقع الجغرافي' : 'GPS Location'}</label>
                  <div className="mt-2 space-y-2">
                    {visitLocation ? (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                        <p className="text-sm text-green-800 font-medium">✅ {isRTL ? 'تم تحديد الموقع' : 'Location Captured'}</p>
                        <p className="text-xs text-green-600 mt-1">
                          📍 {visitLocation.lat.toFixed(6)}, {visitLocation.lng.toFixed(6)}
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 text-xs"
                          onClick={() => setVisitLocation(null)}
                        >
                          {isRTL ? 'إعادة التحديد' : 'Reset Location'}
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Button
                          onClick={captureLocation}
                          disabled={isCapturingLocation}
                          className="w-full"
                        >
                          {isCapturingLocation ? (isRTL ? 'جاري التحديد...' : 'Getting Location...') : (isRTL ? '📍 تحديد الموقع الحالي' : '📍 Capture Current Location')}
                        </Button>
                        {locationError && (
                          <p className="text-xs text-red-600 mt-1">{locationError}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {isRTL ? 'يمكنك تخطي تحديد الموقع إذا تعذر الوصول إليه' : 'You can skip if location is not accessible'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleCreateFieldVisit} className="flex-1" disabled={!visitNotes.trim()}>
                    {isRTL ? 'حفظ الزيارة' : 'Save Visit'}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowFieldVisitDialog(false)}>
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Attachment Upload Dialog */}
      {showAttachmentDialog && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{isRTL ? 'رفع صورة' : 'Upload Image'}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowAttachmentDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{isRTL ? 'تصنيف الصورة' : 'Image Category'}</label>
                  <select
                    value={attachmentCategory}
                    onChange={(e) => setAttachmentCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  >
                    <option value="before">{isRTL ? 'قبل الإصلاح' : 'Before Repair'}</option>
                    <option value="after">{isRTL ? 'بعد الإصلاح' : 'After Repair'}</option>
                    <option value="general">{isRTL ? 'عامة' : 'General'}</option>
                  </select>
                </div>
                
                <div>
                  <label className="text-sm font-medium">{isRTL ? 'اختر الصورة' : 'Select Image'}</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {isRTL ? 'الحد الأقصى: 5 ميجابايت' : 'Max size: 5MB'}
                  </p>
                </div>
                
                {attachmentPreview && (
                  <div>
                    <label className="text-sm font-medium">{isRTL ? 'معاينة' : 'Preview'}</label>
                    <img
                      src={attachmentPreview}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-lg mt-2"
                    />
                  </div>
                )}
                
                <div className="flex gap-2 pt-2">
                  <Button onClick={handleUploadAttachment} className="flex-1" disabled={!attachmentFile}>
                    {isRTL ? 'رفع الصورة' : 'Upload Image'}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => {
                    setShowAttachmentDialog(false)
                    setAttachmentFile(null)
                    setAttachmentPreview('')
                  }}>
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showDeleteDialog && deletingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-destructive">{t('maintenance.deleteRequest')}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {t('maintenance.deleteConfirm')} <strong>{deletingRequest.requestNumber}</strong>؟
              </p>
              <div className="bg-muted/50 border rounded-md p-3 mb-4">
                <p className="text-xs text-muted-foreground">
                  {t('maintenance.property')}: {deletingRequest.property.name}<br/>
                  {t('maintenance.unit')}: {deletingRequest.unit.unitNumber}<br/>
                  {t('maintenance.issue')}: {deletingRequest.issueDescription}
                </p>
              </div>
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
