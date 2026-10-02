import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { unitNumber, propertyId, type, status, tenantName, tenantPhone } = body

    const unit = await prisma.unit.update({
      where: { id: params.id },
      data: {
        unitNumber,
        propertyId,
        type,
        status,
        tenantName,
        tenantPhone,
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
