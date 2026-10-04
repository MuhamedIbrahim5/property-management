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
    const properties = await prisma.property.findMany({
      include: {
        units: true,
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

    return NextResponse.json(properties)
  } catch (error) {
    console.error('Error fetching properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
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
    const { name, neighborhood, address, type } = body

    const property = await prisma.property.create({
      data: {
        name,
        neighborhood,
        address,
        type: type || 'residential',
      },
    })

    return NextResponse.json(property, { status: 201 })
  } catch (error) {
    console.error('Error creating property:', error)
    return NextResponse.json(
      { error: 'Failed to create property' },
      { status: 500 }
    )
  }
}
