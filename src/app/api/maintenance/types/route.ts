import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const types = await prisma.maintenanceType.findMany({
      orderBy: { name: 'asc' }
    })
    return NextResponse.json(types)
  } catch (error) {
    console.error('Error fetching types:', error)
    return NextResponse.json(
      { error: 'Failed to fetch types' },
      { status: 500 }
    )
  }
}
