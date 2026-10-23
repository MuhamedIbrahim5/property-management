import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth-helpers'

export async function GET() {
  // Require admin authentication
  const auth = await requireAdminAuth()
  if (!auth.authorized) {
    return auth.response
  }

  try {
    const units = await prisma.unit.findMany({
      include: {
        property: true,
        _count: {
          select: {
            maintenanceRequests: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(units)
  } catch (error) {
    console.error('Error fetching units:', error)
    return NextResponse.json(
      { error: 'Failed to fetch units' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  // Require admin authentication
  const auth = await requireAdminAuth()
  if (!auth.authorized) {
    return auth.response
  }

  try {
    const body = await request.json()
    const { propertyId, unitNumber, unitNumberEn, type, status, tenantName, tenantPhone } = body

    // SECURITY: Sanitize tenant name - remove HTML/XML tags
    const sanitizedTenantName = tenantName 
      ? tenantName.replace(/<[^>]*>/g, '').trim() 
      : null

    // SECURITY: Sanitize tenant phone - remove non-numeric characters except + and spaces
    const sanitizedTenantPhone = tenantPhone
      ? tenantPhone.replace(/[^0-9+\s-]/g, '').trim()
      : null

    const unit = await prisma.unit.create({
      data: {
        propertyId,
        unitNumber,
        unitNumberEn: unitNumberEn || null,
        type: type || 'residential',
        status: status || 'vacant',
        tenantName: sanitizedTenantName,
        tenantPhone: sanitizedTenantPhone,
      },
    })

    return NextResponse.json(unit, { status: 201 })
  } catch (error) {
    console.error('Error creating unit:', error)
    return NextResponse.json(
      { error: 'Failed to create unit' },
      { status: 500 }
    )
  }
}
