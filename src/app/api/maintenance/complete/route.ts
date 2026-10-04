import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { checkRateLimit, hashCompletionToken, isCompletionTokenExpired } from '@/lib/auth-helpers'
import { validateImageContent, checkRequestSizeLimit } from '@/lib/image-validation'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = checkRateLimit(`complete:${ip}`, 5, 10 * 60 * 1000)
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { 
          error: 'Too many completion attempts. Please try again in 10 minutes.',
          retryAfter: 600 // 10 minutes
        }, 
        { status: 429 }
      )
    }

    // 2. Parse request body
    const body = await request.json()
    const { trackingCode, token, technicianName, technicianPhone, completionImage } = body

    // 3. Validate required fields
    if (!trackingCode || !token || !technicianName || !technicianPhone) {
      return NextResponse.json(
        { error: 'Missing required fields: trackingCode, token, technicianName, technicianPhone' },
        { status: 400 }
      )
    }

    // 4. Validate technician data
    if (technicianName.trim().length < 2) {
      return NextResponse.json(
        { error: 'Technician name must be at least 2 characters' },
        { status: 400 }
      )
    }

    if (!/^[0-9+\-\s()]{10,15}$/.test(technicianPhone.trim())) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    // 5. Validate image if provided
    if (completionImage) {
      const imageValidation = validateImageContent(completionImage)
      if (!imageValidation.valid) {
        return NextResponse.json(
          { error: imageValidation.error },
          { status: 400 }
        )
      }

      // Check total request size
      const sizeCheck = checkRequestSizeLimit(completionImage, 2048)
      if (!sizeCheck.withinLimit) {
        const sizeMB = (sizeCheck.estimatedSize / 1024 / 1024).toFixed(2)
        const maxMB = (sizeCheck.maxAllowed / 1024 / 1024).toFixed(2)
        return NextResponse.json(
          { error: `Request too large: ${sizeMB}MB. Maximum allowed: ${maxMB}MB` },
          { status: 400 }
        )
      }
    }

    // 6. Hash the provided token
    const hashedToken = hashCompletionToken(token)

    // 7. Find and validate the maintenance request
    const maintenanceRequest = await prisma.maintenanceRequest.findFirst({
      where: {
        trackingCode,
        completionToken: hashedToken
      },
      include: {
        status: true
      }
    })

    if (!maintenanceRequest) {
      return NextResponse.json(
        { error: 'Invalid completion link or request not found' },
        { status: 404 }
      )
    }

    // 8. Check if token is expired (30 days)
    if (maintenanceRequest.completionTokenCreatedAt && 
        isCompletionTokenExpired(maintenanceRequest.completionTokenCreatedAt)) {
      return NextResponse.json(
        { error: 'Completion link has expired (30 days limit)' },
        { status: 410 }
      )
    }

    // 9. Check if already used or completed
    if (maintenanceRequest.completionTokenUsed) {
      return NextResponse.json(
        { error: 'This completion link has already been used' },
        { status: 409 }
      )
    }

    if (maintenanceRequest.completedAt || maintenanceRequest.status.isCompleted) {
      return NextResponse.json(
        { error: 'This maintenance request is already completed' },
        { status: 409 }
      )
    }

    // 10. Find completed status
    const completedStatus = await prisma.maintenanceStatus.findFirst({
      where: { isCompleted: true }
    })

    if (!completedStatus) {
      return NextResponse.json(
        { error: 'No completed status found in system configuration' },
        { status: 500 }
      )
    }

    // 11. Atomic update with conditions (prevents race conditions)
    const updateResult = await prisma.maintenanceRequest.updateMany({
      where: {
        id: maintenanceRequest.id,
        completionToken: hashedToken,
        completionTokenUsed: false,
        completedAt: null
      },
      data: {
        technicianName: technicianName.trim(),
        technicianPhone: technicianPhone.trim(),
        completionImage: completionImage || null,
        completedAt: new Date(),
        completedBy: 'technician',
        completionTokenUsed: true,
        statusId: completedStatus.id
      }
    })

    // 12. Check if update was successful
    if (updateResult.count === 0) {
      return NextResponse.json(
        { error: 'Request was completed by another process or is no longer valid' },
        { status: 409 }
      )
    }

    // 13. Return success
    return NextResponse.json({
      success: true,
      message: 'Maintenance request completed successfully',
      requestNumber: maintenanceRequest.requestNumber,
      completedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error completing maintenance request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
