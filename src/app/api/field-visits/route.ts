import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { checkRateLimit, getRateLimitResetMinutes } from '@/lib/rate-limit'
import { validateUploadedFiles } from '@/lib/file-validation'
import { getRateLimitIdentifier } from '@/lib/request-helpers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Helper to calculate distance between two coordinates (Haversine formula)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Earth radius in meters
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

export async function POST(request: Request) {
  try {
    // ============================================
    // STEP 1: AUTHENTICATION CHECK (CRITICAL)
    // ============================================
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to record field visits.' },
        { status: 401 }
      )
    }

    // ============================================
    // STEP 2: AUTHORIZATION CHECK (CRITICAL)
    // ============================================
    const allowedRoles = ['admin', 'manager', 'technician']
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only authorized inspectors can record field visits.' },
        { status: 403 }
      )
    }

    // Extract authenticated user info
    const authenticatedUserId = session.user.id
    const authenticatedUserRole = session.user.role

    // ============================================
    // STEP 3: RATE LIMITING (Per authenticated user)
    // ============================================
    const rateLimitId = `auth-field-visit:${authenticatedUserId}`
    const rateLimit = checkRateLimit(
      rateLimitId,
      10, // Max 10 requests
      15 * 60 * 1000 // Per 15 minutes
    )

    if (!rateLimit.allowed) {
      const resetMinutes = getRateLimitResetMinutes(rateLimit.resetAt)
      return NextResponse.json(
        { 
          error: `Too many visit submissions. Please try again in ${resetMinutes} minutes.`,
          resetAt: rateLimit.resetAt
        },
        { 
          status: 429,
          headers: {
            'Retry-After': (resetMinutes * 60).toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': rateLimit.resetAt.toString()
          }
        }
      )
    }

    // ============================================
    // STEP 4: VALIDATE REQUEST SIZE
    // ============================================
    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'Invalid Content-Type. Expected multipart/form-data' },
        { status: 415 }
      )
    }

    const contentLength = parseInt(request.headers.get('content-length') || '0')
    const MAX_REQUEST_SIZE = 35 * 1024 * 1024 // 35 MB total request
    
    if (contentLength > MAX_REQUEST_SIZE) {
      return NextResponse.json(
        { error: `Request too large: ${(contentLength / 1024 / 1024).toFixed(2)}MB. Maximum: ${MAX_REQUEST_SIZE / 1024 / 1024}MB` },
        { status: 413 }
      )
    }

    // ============================================
    // STEP 5: PARSE AND VALIDATE FORM DATA
    // ============================================
    const formData = await request.formData()

    const requestId = formData.get('requestId') as string
    const token = formData.get('token') as string
    const notes = formData.get('notes') as string
    const latitude = formData.get('latitude') ? parseFloat(formData.get('latitude') as string) : null
    const longitude = formData.get('longitude') ? parseFloat(formData.get('longitude') as string) : null
    const accuracy = formData.get('accuracy') ? parseFloat(formData.get('accuracy') as string) : null

    // Validate required fields
    if (!requestId || !token || !notes) {
      return NextResponse.json(
        { error: 'Missing required fields: requestId, token, and notes are required' },
        { status: 400 }
      )
    }

    // Validate field lengths to prevent abuse
    if (notes.length > 2000) {
      return NextResponse.json(
        { error: 'Notes too long. Maximum 2000 characters allowed.' },
        { status: 400 }
      )
    }

    if (requestId.length > 100 || token.length > 100) {
      return NextResponse.json(
        { error: 'Invalid field length' },
        { status: 400 }
      )
    }

    // ============================================
    // STEP 6: VERIFY TOKEN AND GET PROPERTY
    // ============================================
    const property = await prisma.property.findUnique({
      where: { qrToken: token },
      select: { 
        id: true, 
        latitude: true, 
        longitude: true,
        status: true
      }
    })

    if (!property || property.status !== 'active') {
      return NextResponse.json(
        { error: 'Invalid or inactive property token' },
        { status: 404 }
      )
    }

    // ============================================
    // STEP 7: VERIFY REQUEST AND AUTHORIZATION
    // ============================================
    const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
      where: {
        id: requestId,
        propertyId: property.id,
        status: {
          isCompleted: false
        }
      }
    })

    if (!maintenanceRequest) {
      return NextResponse.json(
        { error: 'Invalid maintenance request for this property or request is already completed' },
        { status: 400 }
      )
    }

    // AUTHORIZATION: Technician can only record visits for assigned requests
    if (authenticatedUserRole === 'technician') {
      if (maintenanceRequest.assigneeId !== authenticatedUserId) {
        return NextResponse.json(
          { error: 'You are not authorized to record a visit for this request. This request is not assigned to you.' },
          { status: 403 }
        )
      }
    }

    // ============================================
    // STEP 8: VALIDATE GPS COORDINATES
    // ============================================
    if (latitude !== null || longitude !== null) {
      // Both must be provided together
      if (latitude === null || longitude === null) {
        return NextResponse.json(
          { error: 'If GPS coordinates are provided, both latitude and longitude are required' },
          { status: 400 }
        )
      }

      // Validate coordinate ranges
      if (latitude < -90 || latitude > 90) {
        return NextResponse.json(
          { error: 'Invalid latitude. Must be between -90 and 90' },
          { status: 400 }
        )
      }

      if (longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { error: 'Invalid longitude. Must be between -180 and 180' },
          { status: 400 }
        )
      }

      // Validate accuracy if provided
      if (accuracy !== null && (accuracy < 0 || accuracy > 10000)) {
        return NextResponse.json(
          { error: 'Invalid GPS accuracy. Must be between 0 and 10000 meters' },
          { status: 400 }
        )
      }
    }

    // ============================================
    // STEP 9: CALCULATE DISTANCE
    // ============================================
    let distanceMeters: number | null = null
    if (
      property.latitude &&
      property.longitude &&
      latitude !== null &&
      longitude !== null
    ) {
      distanceMeters = calculateDistance(
        property.latitude,
        property.longitude,
        latitude,
        longitude
      )
    }

    // ============================================
    // STEP 10: SAVE FIELD VISIT (With authenticated user ID)
    // ============================================
    const fieldVisit = await prisma.fieldVisit.create({
      data: {
        requestId,
        userId: authenticatedUserId, // CRITICAL: Use authenticated user ID from session
        latitude,
        longitude,
        accuracy,
        locationError: latitude === null ? 'Location not available' : null,
        distanceMeters,
        notes
      }
    })

    console.log('Field visit created:', {
      id: fieldVisit.id,
      userId: authenticatedUserId,
      userRole: authenticatedUserRole,
      requestId,
      hasLocation: !!(latitude && longitude),
      distance: distanceMeters
    })

    // ============================================
    // STEP 11: HANDLE IMAGE UPLOADS
    // ============================================
    const imageFiles: File[] = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image_') && value instanceof File) {
        imageFiles.push(value)
      }
    }

    if (imageFiles.length > 0) {
      // SECURITY: Validate all files before processing
      const validationResult = await validateUploadedFiles(imageFiles)
      if (!validationResult.valid) {
        return NextResponse.json(
          { error: `File validation failed: ${validationResult.error}` },
          { status: 400 }
        )
      }

      // Create uploads directory if it doesn't exist
      const uploadsDir = join(process.cwd(), 'public', 'uploads', 'field-visits')
      try {
        await mkdir(uploadsDir, { recursive: true })
      } catch (error) {
        // Directory might already exist, continue
      }

      // Save each validated image
      for (const image of imageFiles) {
        const bytes = await image.arrayBuffer()
        const buffer = Buffer.from(bytes)

        // Generate secure unique filename
        const crypto = require('crypto')
        const ext = image.type.split('/')[1] || 'jpg'
        const uniqueName = `${Date.now()}-${crypto.randomBytes(16).toString('hex')}.${ext}`
        const filepath = join(uploadsDir, uniqueName)
        const publicPath = `/uploads/field-visits/${uniqueName}`

        await writeFile(filepath, buffer)

        // Create attachment record
        await prisma.attachment.create({
          data: {
            requestId,
            fileName: image.name.substring(0, 255),
            filePath: publicPath,
            fileType: image.type,
            fileSize: image.size,
            category: 'field-visit',
            uploadedBy: session.user.name || session.user.email
          }
        })
      }
    }

    return NextResponse.json({
      success: true,
      visitId: fieldVisit.id,
      message: 'Field visit saved successfully',
      recordedBy: session.user.name
    })
  } catch (error) {
    console.error('Error saving field visit:', error)
    return NextResponse.json(
      { error: 'Failed to save field visit' },
      { status: 500 }
    )
  }
}
