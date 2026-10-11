import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Public API endpoint for fetching properties list
 * This endpoint is accessible without authentication
 * Returns only minimal data needed for the public request form
 */
export async function GET() {
  try {
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        name: true,
        neighborhood: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(properties)
  } catch (error) {
    console.error('Error fetching public properties:', error)
    return NextResponse.json(
      { error: 'Failed to fetch properties' },
      { status: 500 }
    )
  }
}
