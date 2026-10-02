import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function generateRequestNumber() {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `REQ-${year}-${random}`
}

function generateTrackingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function GET() {
  try {
    const requests = await prisma.maintenanceRequest.findMany({
      include: {
        property: true,
        unit: true,
        type: true,
        status: true,
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching maintenance requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      propertyId,
      unitId,
      issueDescription,
      typeId,
      priority,
      requesterName,
      requesterPhone,
      isPublicRequest,
    } = body

    // Get default status
    const defaultStatus = await prisma.maintenanceStatus.findFirst({
      where: { isDefault: true },
    })

    if (!defaultStatus) {
      return NextResponse.json(
        { error: 'No default status found' },
        { status: 400 }
      )
    }

    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        requestNumber: generateRequestNumber(),
        trackingCode: generateTrackingCode(),
        propertyId,
        unitId,
        issueDescription,
        typeId,
        statusId: defaultStatus.id,
        priority: priority || 'normal',
        requesterName,
        requesterPhone,
        isPublicRequest: isPublicRequest || false,
      },
      include: {
        property: true,
        unit: true,
        type: true,
        status: true,
      },
    })

    return NextResponse.json(maintenanceRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating maintenance request:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance request' },
      { status: 500 }
    )
  }
}
