'use client'

import { useState, useMemo } from 'react'
import { Wrench, Plus, Search, Filter, X, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type Request = {
  id: string
  requestNumber: string
  issueDescription: string
  priority: string
  createdAt: Date
  property: { name: string }
  unit: { unitNumber: string }
  type: { name: string; id: string }
  status: { name: string; id: string }
  assignee: { id: string; name: string } | null
}

export default function MaintenanceClient({
  initialRequests,
  statuses,
  types,
  users
}: {
  initialRequests: Request[]
  statuses: { id: string; name: string }[]
  types: { id: string; name: string }[]
  users: { id: string; name: string }[]
}) {
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
  const [newAssignee, setNewAssignee] = useState('')

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

  const getStatusVariant = (status: string) => {
    if (status.includes('مكتمل')) return 'success'
    if (status.includes('التنفيذ')) return 'warning'
    if (status.includes('ملغي')) return 'destructive'
    return 'default'
  }

  const getPriorityVariant = (priority: string) => {
    if (priority === 'urgent') return 'destructive'
    if (priority === 'normal') return 'default'
    return 'secondary'
  }

  const getPriorityText = (priority: string) => {
    if (priority === 'urgent') return 'عاجل'
    if (priority === 'normal') return 'عادي'
    return 'منخفض'
  }

  const handleViewRequest = (req: Request) => {
    setSelectedRequest(req)
    setNewStatus(req.status.id)
    setNewAssignee(req.assignee?.id || '')
    setShowDetailDialog(true)
  }

  const handleUpdateRequest = async () => {
    if (!selectedRequest) return
    
    try {
      const res = await fetch(`/api/maintenance/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statusId: newStatus,
          assigneeId: newAssignee || null
        })
      })
      
      if (!res.ok) throw new Error('Failed to update')
      
      const updated = await res.json()
      setRequests(reqs => reqs.map(r => r.id === updated.id ? {
        ...r,
        status: statuses.find(s => s.id === updated.statusId)!,
        assignee: updated.assigneeId ? users.find(u => u.id === updated.assigneeId)! : null
      } : r))
      
      setShowDetailDialog(false)
      alert('تم التحديث بنجاح')
    } catch (error) {
      console.error('Error updating request:', error)
      alert('حدث خطأ أثناء التحديث')
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
      alert(error.message || 'حدث خطأ أثناء الحذف')
    }
  }

  const clearFilters = () => {
    setSearchTerm('')
    setSelectedStatus('')
    setSelectedType('')
    setSelectedPriority('')
    setSelectedTechnician('')
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">بلاغات الصيانة</h2>
            <p className="text-sm text-muted-foreground">
              إدارة ومتابعة طلبات الصيانة ({filteredRequests.length} بلاغ)
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
                  placeholder="البحث في البلاغات..."
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
                تصفية
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
                  <label className="text-xs font-medium">الحالة</label>
                  <select
                    value={selectedStatus}
                    onChange={(e) => setSelectedStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">الكل</option>
                    {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">النوع</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">الكل</option>
                    {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">الأولوية</label>
                  <select
                    value={selectedPriority}
                    onChange={(e) => setSelectedPriority(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="">الكل</option>
                    <option value="low">منخفض</option>
                    <option value="normal">عادي</option>
                    <option value="urgent">عاجل</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium">الفني</label>
                  <input
                    type="text"
                    value={selectedTechnician}
                    onChange={(e) => setSelectedTechnician(e.target.value)}
                    placeholder="اسم أو رقم الفني"
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
              <h3 className="mt-4 text-lg font-semibold text-foreground">لا توجد بلاغات</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {searchTerm || selectedStatus || selectedType || selectedPriority
                  ? 'لا توجد نتائج للبحث'
                  : 'لم يتم إنشاء أي بلاغات صيانة بعد'}
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
                      <th className="px-4 py-3 text-right text-xs font-bold">رقم البلاغ</th>
                      <th className="px-4 py-3 text-right text-xs font-bold">العقار / الوحدة</th>
                      <th className="px-4 py-3 text-right text-xs font-bold">المشكلة</th>
                      <th className="px-4 py-3 text-right text-xs font-bold">النوع</th>
                      <th className="px-4 py-3 text-right text-xs font-bold">الحالة</th>
                      <th className="px-4 py-3 text-right text-xs font-bold">الأولوية</th>
                      <th className="px-4 py-3 text-right text-xs font-bold">المسؤول</th>
                      <th className="px-4 py-3 text-right text-xs font-bold">الفني</th>
                      <th className="px-4 py-3 text-right text-xs font-bold">التاريخ</th>
                      <th className="px-4 py-3 text-right text-xs font-bold">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-semibold text-primary">{request.requestNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium">{request.property.name}</p>
                            <p className="text-xs text-muted-foreground">{request.unit.unitNumber}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm line-clamp-2 max-w-xs">{request.issueDescription}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="text-xs">{request.type.name}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getStatusVariant(request.status.name)}>{request.status.name}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant={getPriorityVariant(request.priority)}>{getPriorityText(request.priority)}</Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-muted-foreground">{request.assignee?.name || 'غير محدد'}</span>
                        </td>
                        <td className="px-4 py-3">
                          {(request as any).technicianName ? (
                            <div>
                              <p className="text-sm font-medium">{(request as any).technicianName}</p>
                              <p className="text-xs text-muted-foreground">{(request as any).technicianPhone}</p>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-muted-foreground">
                            {new Date(request.createdAt).toLocaleDateString('ar-SA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleViewRequest(request)}>عرض</Button>
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
                <h3 className="text-lg font-bold">تفاصيل البلاغ - {selectedRequest.requestNumber}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">وصف المشكلة</label>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedRequest.issueDescription}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">العقار</label>
                    <p className="mt-1 text-sm">{selectedRequest.property.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">الوحدة</label>
                    <p className="mt-1 text-sm">{selectedRequest.unit.unitNumber}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">النوع</label>
                    <p className="mt-1 text-sm">{selectedRequest.type.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">الأولوية</label>
                    <p className="mt-1 text-sm">{getPriorityText(selectedRequest.priority)}</p>
                  </div>
                </div>
                
                {(selectedRequest as any).technicianName && (
                  <div className="rounded-lg bg-good/10 border border-good/20 p-4">
                    <p className="text-sm font-semibold text-good mb-2">✅ تم إتمام البلاغ بواسطة الفني</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">اسم الفني</label>
                        <p className="mt-1 text-sm">{(selectedRequest as any).technicianName}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-muted-foreground">رقم الجوال</label>
                        <p className="mt-1 text-sm">{(selectedRequest as any).technicianPhone}</p>
                      </div>
                    </div>
                    {(selectedRequest as any).completionImage && (
                      <div className="mt-3">
                        <label className="text-xs font-medium text-muted-foreground">صورة إثبات التنفيذ</label>
                        <img 
                          src={(selectedRequest as any).completionImage} 
                          alt="Completion" 
                          className="mt-2 w-full h-48 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium">الحالة</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  >
                    {statuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium">المسؤول</label>
                  <select
                    value={newAssignee}
                    onChange={(e) => setNewAssignee(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md mt-1"
                  >
                    <option value="">غير محدد</option>
                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleUpdateRequest} className="flex-1">تحديث</Button>
                  <Button variant="outline" className="flex-1" onClick={() => setShowDetailDialog(false)}>إلغاء</Button>
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
                <h3 className="text-lg font-bold text-destructive">تأكيد الحذف</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowDeleteDialog(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                هل أنت متأكد من حذف طلب الصيانة <strong>{deletingRequest.requestNumber}</strong>؟
              </p>
              <div className="bg-muted/50 border rounded-md p-3 mb-4">
                <p className="text-xs text-muted-foreground">
                  العقار: {deletingRequest.property.name}<br/>
                  الوحدة: {deletingRequest.unit.unitNumber}<br/>
                  المشكلة: {deletingRequest.issueDescription}
                </p>
              </div>
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
