import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireTechnicianAuth, requireAdminAuth } from '@/lib/auth-helpers'
import { validateImageContent } from '@/lib/image-validation'
import { checkRateLimit, getRateLimitResetMinutes } from '@/lib/rate-limit'

export async function POST(
  request: Request,
  context: { params: { id: string } }
) {
  const auth = await requireTechnicianAuth()
  if (!auth.authorized) {
    return auth.response
  }

  // SECURITY: Rate limiting for file uploads to prevent abuse
  const rateLimitId = `attachment:${auth.user!.id}`
  const rateLimit = checkRateLimit(
    rateLimitId,
    10, // Max 10 attachments
    60 * 1000 // Per 1 minute
  )

  if (!rateLimit.allowed) {
    const resetMinutes = getRateLimitResetMinutes(rateLimit.resetAt)
    return NextResponse.json(
      { 
        error: `Too many upload requests. Please wait ${resetMinutes} minute(s).`,
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

  const body = await request.json()
  const { params } = context
  
  try {
    const { image, category, fileName } = body

    if (!image) {
      return NextResponse.json(
        { error: 'Image is required' },
        { status: 400 }
      )
    }

    // Validate image
    const imageValidation = validateImageContent(image)
    if (!imageValidation.valid) {
      return NextResponse.json(
        { error: imageValidation.error },
        { status: 400 }
      )
    }

    // Verify maintenance request exists and check access
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: params.id },
      select: { requestNumber: true, assigneeId: true },
    })

    if (!maintenanceRequest) {
      return NextResponse.json(
        { error: 'Maintenance request not found' },
        { status: 404 }
      )
    }

    // Check access: Technician can only upload attachments for assigned requests
    const userRole = auth.user!.role
    const userId = auth.user!.id
    
    if (userRole === 'technician') {
      if (maintenanceRequest.assigneeId !== userId) {
        return NextResponse.json(
          { error: 'غير مصرح لك برفع مرفقات لهذا البلاغ. البلاغ غير مسند إليك.' },
          { status: 403 }
        )
      }
    }

    // Determine category (before, after, general)
    const attachmentCategory = category || 'general'
    const validCategories = ['before', 'after', 'general', 'invoice', 'report']
    
    if (!validCategories.includes(attachmentCategory)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Create attachment
    const attachment = await prisma.attachment.create({
      data: {
        requestId: params.id,
        fileName: fileName || `${attachmentCategory}-${Date.now()}.jpg`,
        filePath: image,
        fileType: image.match(/data:image\/(\w+);/)?.[1] || 'jpeg',
        fileSize: Math.round((image.length * 3) / 4),
        category: attachmentCategory,
        uploadedBy: auth.user!.id,
      },
    })

    console.log('Attachment created:', {
      id: attachment.id,
      requestNumber: maintenanceRequest.requestNumber,
      category: attachmentCategory,
    })

    return NextResponse.json(attachment, { status: 201 })
  } catch (error) {
    console.error('Error creating attachment:', error)
    return NextResponse.json(
      { error: 'Failed to create attachment' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  const auth = await requireTechnicianAuth()
  if (!auth.authorized) {
    return auth.response
  }

  const { searchParams } = new URL(request.url)
  const { params } = context
  
  try {
    // Verify maintenance request exists and check access
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: params.id },
      select: { assigneeId: true },
    })

    if (!maintenanceRequest) {
      return NextResponse.json(
        { error: 'Maintenance request not found' },
        { status: 404 }
      )
    }

    // Check access: Technician can only view attachments for assigned requests
    const userRole = auth.user!.role
    const userId = auth.user!.id
    
    if (userRole === 'technician') {
      if (maintenanceRequest.assigneeId !== userId) {
        return NextResponse.json(
          { error: 'غير مصرح لك بعرض مرفقات هذا البلاغ. البلاغ غير مسند إليك.' },
          { status: 403 }
        )
      }
    }

    const category = searchParams.get('category')

    const where: any = { requestId: params.id }
    if (category) {
      where.category = category
    }

    const attachments = await prisma.attachment.findMany({
      where,
      orderBy: {
        createdAt: 'asc',
      },
    })

    return NextResponse.json(attachments)
  } catch (error) {
    console.error('Error fetching attachments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch attachments' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminAuth()
  if (!auth.authorized) {
    return auth.response
  }

  try {
    const { searchParams } = new URL(request.url)
    const attachmentId = searchParams.get('attachmentId')

    if (!attachmentId) {
      return NextResponse.json(
        { error: 'attachmentId is required' },
        { status: 400 }
      )
    }

    // Verify attachment belongs to this request
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    })

    if (!attachment || attachment.requestId !== params.id) {
      return NextResponse.json(
        { error: 'Attachment not found or does not belong to this request' },
        { status: 404 }
      )
    }

    await prisma.attachment.delete({
      where: { id: attachmentId },
    })

    return NextResponse.json({ message: 'Attachment deleted successfully' })
  } catch (error) {
    console.error('Error deleting attachment:', error)
    return NextResponse.json(
      { error: 'Failed to delete attachment' },
      { status: 500 }
    )
  }
}
