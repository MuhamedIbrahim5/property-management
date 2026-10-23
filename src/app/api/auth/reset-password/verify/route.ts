import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashToken } from '@/lib/email'

// Force dynamic rendering for this route since it uses search params
export const dynamic = 'force-dynamic'

/**
 * GET /api/auth/reset-password/verify?token=xxx
 * Verify if a reset token is valid
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'Missing token' },
        { status: 400 }
      )
    }

    // Hash the token to compare with database
    const hashedToken = hashToken(token)

    // Find user with this token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: hashedToken,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        resetTokenExpiry: true,
        resetTokenUsed: true,
      },
    })

    if (!user) {
      return NextResponse.json({
        valid: false,
        error: 'invalid',
        message: 'Invalid or expired reset link',
      })
    }

    // Check if token was already used
    if (user.resetTokenUsed) {
      return NextResponse.json({
        valid: false,
        error: 'used',
        message: 'This reset link has already been used',
      })
    }

    // Check if token is expired
    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      return NextResponse.json({
        valid: false,
        error: 'expired',
        message: 'This reset link has expired',
      })
    }

    // Token is valid
    return NextResponse.json({
      valid: true,
      email: user.email,
    })
  } catch (error) {
    console.error('[Verify Reset Token] Error:', error)
    return NextResponse.json(
      { valid: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
