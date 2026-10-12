import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashToken } from '@/lib/email'
import bcrypt from 'bcryptjs'

/**
 * POST /api/auth/reset-password
 * Reset password with valid token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    // Validate inputs
    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid token' },
        { status: 400 }
      )
    }

    if (!password || typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
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
      return NextResponse.json(
        { 
          error: 'invalid',
          message: 'Invalid or expired reset link',
        },
        { status: 400 }
      )
    }

    // Check if token was already used
    if (user.resetTokenUsed) {
      return NextResponse.json(
        { 
          error: 'used',
          message: 'This reset link has already been used',
        },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (!user.resetTokenExpiry || new Date() > user.resetTokenExpiry) {
      return NextResponse.json(
        { 
          error: 'expired',
          message: 'This reset link has expired',
        },
        { status: 400 }
      )
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Update password and invalidate the reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        resetTokenUsed: true,
        updatedAt: new Date(),
      },
    })

    // Note: We don't invalidate existing sessions here
    // The user can continue using their old sessions or will need to re-login
    // If you want to invalidate sessions, you'd need to implement session tracking

    return NextResponse.json({
      success: true,
      message: 'Password reset successful',
    })
  } catch (error) {
    console.error('[Reset Password] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
