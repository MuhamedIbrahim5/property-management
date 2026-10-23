import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth-helpers'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Require admin authentication
  const auth = await requireAdminAuth()
  if (!auth.authorized) {
    return auth.response
  }

  try {
    const body = await request.json()
    const { 
      statusId, 
      assigneeId, 
      technicianName, 
      technicianPhone, 
      completionImage, 
      completedAt,
      completedBy 
    } = body

    // Validate: If status is being set to "completed", enforce strict validation
    if (statusId) {
      const newStatus = await prisma.maintenanceStatus.findUnique({
        where: { id: statusId }
      })
      
      if (newStatus?.isCompleted) {
        // Strict validation for completion
        if (!technicianName || technicianName.trim() === '') {
          return NextResponse.json(
            { error: 'اسم الفني مطلوب لإتمام البلاغ' },
            { status: 400 }
          )
        }
        
        // Check for required attachments (before and after images)
        const attachments = await prisma.attachment.findMany({
          where: { requestId: params.id },
          select: { category: true }
        })
        
        const beforeImages = attachments.filter(a => a.category === 'before')
        const afterImages = attachments.filter(a => a.category === 'after')
        
        if (beforeImages.length === 0) {
          return NextResponse.json(
            { error: 'يجب رفع صور قبل الإصلاح لإتمام البلاغ' },
            { status: 400 }
          )
        }
        
        if (afterImages.length === 0) {
          return NextResponse.json(
            { error: 'يجب رفع صور بعد الإصلاح لإتمام البلاغ' },
            { status: 400 }
          )
        }
        
        // Check for field visits with notes
        const fieldVisits = await prisma.fieldVisit.findMany({
          where: { requestId: params.id },
          select: { notes: true }
        })
        
        if (fieldVisits.length === 0) {
          return NextResponse.json(
            { error: 'يجب تسجيل زيارة ميدانية واحدة على الأقل لإتمام البلاغ' },
            { status: 400 }
          )
        }
        
        const visitsWithNotes = fieldVisits.filter(v => v.notes && v.notes.trim() !== '')
        if (visitsWithNotes.length === 0) {
          return NextResponse.json(
            { error: 'يجب كتابة ملاحظات العمل في الزيارة الميدانية لإتمام البلاغ' },
            { status: 400 }
          )
        }
      }
    }

    const updateData: any = {}
    
    if (statusId !== undefined) updateData.statusId = statusId
    if (assigneeId !== undefined) updateData.assigneeId = assigneeId || null
    if (technicianName !== undefined) updateData.technicianName = technicianName
    if (technicianPhone !== undefined) updateData.technicianPhone = technicianPhone
    if (completionImage !== undefined) updateData.completionImage = completionImage
    if (completedAt !== undefined) updateData.completedAt = new Date(completedAt)
    if (completedBy !== undefined) updateData.completedBy = completedBy

    const maintenanceRequest = await prisma.maintenanceRequest.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(maintenanceRequest)
  } catch (error) {
    console.error('Error updating maintenance request:', error)
    return NextResponse.json(
      { error: 'Failed to update maintenance request' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Require admin authentication
  const auth = await requireAdminAuth()
  if (!auth.authorized) {
    return auth.response
  }

  try {
    await prisma.maintenanceRequest.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Maintenance request deleted' })
  } catch (error) {
    console.error('Error deleting maintenance request:', error)
    return NextResponse.json(
      { error: 'Failed to delete maintenance request' },
      { status: 500 }
    )
  }
}
