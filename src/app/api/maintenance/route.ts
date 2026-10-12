import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth, generateCompletionToken, encryptToken } from '@/lib/auth-helpers'
import { buildAppUrl } from '@/lib/url'
import { validateImageContent } from '@/lib/image-validation'

function generateRequestNumber() {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `REQ-${year}-${random}`
}

function generateTrackingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function GET() {
  // Require admin authentication
  const auth = await requireAdminAuth()
  if (!auth.authorized) {
    return auth.response
  }

  try {
    const requests = await prisma.maintenanceRequest.findMany({
      include: {
        property: true,
        unit: true,
        type: true,
        status: true,
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            filePath: true,
            fileType: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(requests)
  } catch (error) {
    console.error('Error fetching maintenance requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch maintenance requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      propertyId,
      unitId,
      issueDescription,
      typeId,
      priority,
      requesterName,
      requesterPhone,
      isPublicRequest,
      requestedDate,
      requestedTime,
      attachmentImage,
    } = body

    // Log received data (without sensitive info) for debugging
    console.log('Received maintenance request:', {
      propertyId: propertyId ? 'present' : 'missing',
      unitId: unitId ? 'present' : 'missing',
      issueDescription: issueDescription ? 'present' : 'missing',
      typeId: typeId ? 'present' : 'missing',
      requesterName: requesterName ? 'present' : 'missing',
      requesterPhone: requesterPhone ? 'present' : 'missing',
      priority: priority || 'not provided',
      isPublicRequest,
    })

    // Validate required fields with specific error messages
    const missingFields = []
    if (!propertyId) missingFields.push('propertyId')
    if (!unitId) missingFields.push('unitId')
    if (!issueDescription) missingFields.push('issueDescription')
    if (!typeId) missingFields.push('typeId')
    if (!requesterName) missingFields.push('requesterName')
    if (!requesterPhone) missingFields.push('requesterPhone')

    if (missingFields.length > 0) {
      console.error('Missing required fields:', missingFields)
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          missingFields,
          details: 'Please ensure all required fields are filled'
        },
        { status: 400 }
      )
    }

    // Validate image if provided
    if (attachmentImage) {
      const imageValidation = validateImageContent(attachmentImage)
      if (!imageValidation.valid) {
        return NextResponse.json(
          { error: imageValidation.error },
          { status: 400 }
        )
      }
    }

    // Get default status
    const defaultStatus = await prisma.maintenanceStatus.findFirst({
      where: { isDefault: true },
    })

    if (!defaultStatus) {
      return NextResponse.json(
        { error: 'No default status found' },
        { status: 400 }
      )
    }

    // Generate secure completion token
    const { token: completionToken, hash: completionTokenHash } = generateCompletionToken()
    const completionTokenPlain = encryptToken(completionToken)

    // Parse requested date if provided
    let parsedDate: Date | null = null
    if (requestedDate) {
      try {
        parsedDate = new Date(requestedDate)
        if (isNaN(parsedDate.getTime())) {
          parsedDate = null
        }
      } catch (e) {
        parsedDate = null
      }
    }

    // Create maintenance request
    const maintenanceRequest = await prisma.maintenanceRequest.create({
      data: {
        requestNumber: generateRequestNumber(),
        trackingCode: generateTrackingCode(),
        propertyId,
        unitId,
        issueDescription,
        typeId,
        statusId: defaultStatus.id,
        priority: priority || 'normal',
        requesterName,
        requesterPhone,
        isPublicRequest: isPublicRequest || false,
        requestedDate: parsedDate,
        requestedTime: requestedTime || null,
        completionToken: completionTokenHash,
        completionTokenPlain: completionTokenPlain,
        completionTokenCreatedAt: new Date(),
        completionTokenUsed: false,
      },
      include: {
        property: true,
        unit: true,
        type: true,
        status: true,
      },
    })

    console.log('Maintenance request created successfully:', {
      requestNumber: maintenanceRequest.requestNumber,
      trackingCode: maintenanceRequest.trackingCode,
      id: maintenanceRequest.id,
    })

    // Create attachment if image provided
    if (attachmentImage) {
      try {
        await prisma.attachment.create({
          data: {
            requestId: maintenanceRequest.id,
            fileName: `request-${maintenanceRequest.requestNumber}.jpg`,
            filePath: attachmentImage, // Store base64 in database
            fileType: attachmentImage.match(/data:image\/(\w+);/)?.[1] || 'jpeg',
            fileSize: Math.round((attachmentImage.length * 3) / 4),
            uploadedBy: 'public-request',
          },
        })
        console.log('Attachment saved successfully')
      } catch (attachmentError) {
        console.error('Error saving attachment (request still created):', attachmentError)
        // Don't fail the request if attachment fails
      }
    }

    // Return response with completion URL for public requests
    const response: any = {
      ...maintenanceRequest,
      completionUrl: isPublicRequest
        ? buildAppUrl(`/complete/${maintenanceRequest.trackingCode}?token=${completionToken}`)
        : undefined
    }

    // Remove sensitive fields from response
    delete response.completionToken
    delete response.completionTokenCreatedAt
    delete response.completionTokenUsed

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Error creating maintenance request:', error)
    return NextResponse.json(
      { error: 'Failed to create maintenance request' },
      { status: 500 }
    )
  }
}
