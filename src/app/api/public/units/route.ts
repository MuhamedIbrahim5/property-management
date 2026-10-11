import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * Public API endpoint for fetching units list
 * This endpoint is accessible without authentication
 * Returns only minimal data needed for the public request form
 * Does NOT return tenant information or sensitive data
 */
export async function GET() {
  try {
    const units = await prisma.unit.findMany({
      select: {
        id: true,
        unitNumber: true,
        propertyId: true,
        // Explicitly exclude tenant information
        // tenantName, tenantPhone, tenantEmail are NOT included
      },
      orderBy: {
        unitNumber: 'asc',
      },
    })

    return NextResponse.json(units)
  } catch (error) {
    console.error('Error fetching public units:', error)
    return NextResponse.json(
      { error: 'Failed to fetch units' },
      { status: 500 }
    )
  }
}
