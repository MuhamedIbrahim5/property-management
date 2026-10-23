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
    const { unitNumber, unitNumberEn, propertyId, type, status, tenantName, tenantPhone } = body

    // SECURITY: Sanitize tenant name - remove HTML/XML tags
    const sanitizedTenantName = tenantName 
      ? tenantName.replace(/<[^>]*>/g, '').trim() 
      : null

    // SECURITY: Sanitize tenant phone - remove non-numeric characters except + and spaces
    const sanitizedTenantPhone = tenantPhone
      ? tenantPhone.replace(/[^0-9+\s-]/g, '').trim()
      : null

    const unit = await prisma.unit.update({
      where: { id: params.id },
      data: {
        unitNumber,
        unitNumberEn: unitNumberEn || null,
        propertyId,
        type,
        status,
        tenantName: sanitizedTenantName,
        tenantPhone: sanitizedTenantPhone,
      },
    })

    return NextResponse.json(unit)
  } catch (error) {
    console.error('Error updating unit:', error)
    return NextResponse.json(
      { error: 'Failed to update unit' },
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
    await prisma.unit.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Unit deleted' })
  } catch (error) {
    console.error('Error deleting unit:', error)
    return NextResponse.json(
      { error: 'Failed to delete unit' },
      { status: 500 }
    )
  }
}
