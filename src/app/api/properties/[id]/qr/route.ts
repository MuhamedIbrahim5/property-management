import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth-helpers'
import { randomBytes } from 'crypto'

// Generate QR token for property
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminAuth()
  if (!auth.authorized) {
    return auth.response
  }

  try {
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: { id: true, name: true, qrToken: true }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // If QR token already exists, return it
    if (property.qrToken) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      return NextResponse.json({
        qrToken: property.qrToken,
        qrUrl: `${appUrl}/field/property/${property.qrToken}`
      })
    }

    // Generate new token (32 bytes = 64 hex characters)
    const qrToken = randomBytes(32).toString('hex')

    // Update property with new token
    await prisma.property.update({
      where: { id: params.id },
      data: { qrToken }
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return NextResponse.json({
      qrToken,
      qrUrl: `${appUrl}/field/property/${qrToken}`
    })
  } catch (error) {
    console.error('Error generating QR token:', error)
    return NextResponse.json(
      { error: 'Failed to generate QR token' },
      { status: 500 }
    )
  }
}

// Regenerate QR token (invalidate old one)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminAuth()
  if (!auth.authorized) {
    return auth.response
  }

  try {
    const property = await prisma.property.findUnique({
      where: { id: params.id },
      select: { id: true }
    })

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Generate new token
    const qrToken = randomBytes(32).toString('hex')

    await prisma.property.update({
      where: { id: params.id },
      data: { qrToken }
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return NextResponse.json({
      qrToken,
      qrUrl: `${appUrl}/field/property/${qrToken}`,
      message: 'QR token regenerated successfully'
    })
  } catch (error) {
    console.error('Error regenerating QR token:', error)
    return NextResponse.json(
      { error: 'Failed to regenerate QR token' },
      { status: 500 }
    )
  }
}
