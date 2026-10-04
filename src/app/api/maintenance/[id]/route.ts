import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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
