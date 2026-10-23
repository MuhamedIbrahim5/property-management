import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTechnicianAuth } from '@/lib/auth-helpers'
import { checkRateLimit, getRateLimitResetMinutes } from '@/lib/rate-limit'

export async function GET(request: Request) {
  const auth = await requireTechnicianAuth()
  if (!auth.authorized) {
    return auth.response
  }

  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')

    const userRole = auth.user!.role
    const userId = auth.user!.id

    // Build where clause with proper filtering at database level
    let where: any = {}

    if (requestId) {
      where.requestId = requestId
    }

    // Apply role-based filtering at query level (NOT post-fetch)
    if (userRole === 'technician') {
      // Technician can only see visits for assigned requests or their own visits
      where.OR = [
        { userId: userId },
        {
          request: {
            assigneeId: userId
          }
        }
      ]
    }
    // Admin and Manager can see all visits (no additional filtering needed)

    const visits = await prisma.fieldVisit.findMany({
      where,
      include: {
        request: {
          select: {
            requestNumber: true,
            trackingCode: true,
            issueDescription: true,
            assigneeId: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        visitDate: 'desc',
      },
    })

    return NextResponse.json(visits)
  } catch (error) {
    console.error('Error fetching field visits:', error)
    return NextResponse.json(
      { error: 'Failed to fetch field visits' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  const auth = await requireTechnicianAuth()
  if (!auth.authorized) {
    return auth.response
  }

  // SECURITY: Rate limiting for authenticated users to prevent abuse
  const rateLimitId = `auth-visit:${auth.user!.id}`
  const rateLimit = checkRateLimit(
    rateLimitId,
    20, // Max 20 visits
    60 * 1000 // Per 1 minute
  )

  if (!rateLimit.allowed) {
    const resetMinutes = getRateLimitResetMinutes(rateLimit.resetAt)
    return NextResponse.json(
      { 
        error: `Too many visit submissions. Please wait ${resetMinutes} minute(s).`,
        resetAt: rateLimit.resetAt
      },
      { 
        status: 429,
        headers: {
          'Retry-After': (resetMinutes * 60).toString(),
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': rateLimit.resetAt.toString()
        }
      }
    )
  }

  try {
    const body = await request.json()
    const {
      requestId,
      latitude,
      longitude,
      accuracy,
      locationError,
      notes,
    } = body

    // Validate required fields
    if (!requestId) {
      return NextResponse.json(
        { error: 'Missing requestId' },
        { status: 400 }
      )
    }

    // Verify maintenance request exists and check access
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
      include: {
        property: {
          select: {
            latitude: true,
            longitude: true,
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

    // Check access: Technician can only record visits for assigned requests
    const userRole = auth.user!.role
    const userId = auth.user!.id
    
    if (userRole === 'technician') {
      if (maintenanceRequest.assigneeId !== userId) {
        return NextResponse.json(
          { error: 'غير مصرح لك بتسجيل زيارة لهذا البلاغ. البلاغ غير مسند إليك.' },
          { status: 403 }
        )
      }
    }

    // Calculate distance if both technician and property have coordinates
    let distanceMeters: number | null = null
    if (
      latitude &&
      longitude &&
      maintenanceRequest.property.latitude &&
      maintenanceRequest.property.longitude
    ) {
      distanceMeters = calculateDistance(
        latitude,
        longitude,
        maintenanceRequest.property.latitude,
        maintenanceRequest.property.longitude
      )
    }

    // Create field visit
    const fieldVisit = await prisma.fieldVisit.create({
      data: {
        requestId,
        userId: auth.user!.id,
        visitDate: new Date(),
        latitude: latitude || null,
        longitude: longitude || null,
        accuracy: accuracy || null,
        locationError: locationError || null,
        distanceMeters,
        notes: notes || null,
      },
      include: {
        request: {
          select: {
            requestNumber: true,
            trackingCode: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
    })

    console.log('Field visit created:', {
      id: fieldVisit.id,
      requestNumber: fieldVisit.request.requestNumber,
      hasLocation: !!(latitude && longitude),
      distance: distanceMeters,
    })

    return NextResponse.json(fieldVisit, { status: 201 })
  } catch (error) {
    console.error('Error creating field visit:', error)
    return NextResponse.json(
      { error: 'Failed to create field visit' },
      { status: 500 }
    )
  }
}

// Haversine formula to calculate distance between two GPS coordinates
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c // Distance in meters
}
