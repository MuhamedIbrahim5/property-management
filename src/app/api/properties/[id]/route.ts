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
    const { name, neighborhood, address, type, status } = body

    const property = await prisma.property.update({
      where: { id: params.id },
      data: {
        name,
        neighborhood,
        address,
        type,
        status,
      },
    })

    return NextResponse.json(property)
  } catch (error) {
    console.error('Error updating property:', error)
    return NextResponse.json(
      { error: 'Failed to update property' },
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
    await prisma.property.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Property deleted' })
  } catch (error) {
    console.error('Error deleting property:', error)
    return NextResponse.json(
      { error: 'Failed to delete property' },
      { status: 500 }
    )
  }
}
