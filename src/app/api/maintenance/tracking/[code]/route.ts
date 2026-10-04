import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { trackingCode: params.code },
      include: {
        property: true,
        unit: true,
        type: true,
        status: true,
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!maintenanceRequest) {
      return NextResponse.json(
        { error: 'Maintenance request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(maintenanceRequest)
  } catch (error) {
    console.error('Error fetching maintenance request:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance request' },
      { status: 500 }
    )
  }
}
