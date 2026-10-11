import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Public API endpoint for fetching maintenance types
 * This endpoint is accessible without authentication
 * Returns maintenance types for the public request form
 */
export async function GET() {
  try {
    const types = await prisma.maintenanceType.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    return NextResponse.json(types)
  } catch (error) {
    console.error('Error fetching public maintenance types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance types' },
      { status: 500 }
    )
  }
}
