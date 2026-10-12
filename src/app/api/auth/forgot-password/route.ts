import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateSecureToken, hashToken, sendEmail, generatePasswordResetEmail } from '@/lib/email'
import { checkRateLimit, getRateLimitResetMinutes } from '@/lib/rate-limit'

/**
 * POST /api/auth/forgot-password
 * Request a password reset link
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Rate limiting: 3 requests per 15 minutes per email
    const rateLimitResult = checkRateLimit(normalizedEmail, 3, 15 * 60 * 1000)
    
    if (!rateLimitResult.allowed) {
      const minutesRemaining = getRateLimitResetMinutes(rateLimitResult.resetAt)
      return NextResponse.json(
        { 
          error: 'Too many requests',
          message: `Please wait ${minutesRemaining} minutes before trying again`,
          retryAfter: minutesRemaining * 60,
        },
        { status: 429 }
      )
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
      },
    })

    // IMPORTANT: Always return success even if email doesn't exist
    // This prevents email enumeration attacks
    if (!user || !user.isActive) {
      // Wait a bit to prevent timing attacks
      await new Promise((resolve) => setTimeout(resolve, 200))
      return NextResponse.json({
        success: true,
        message: 'If your email is registered, you will receive a password reset link',
      })
    }

    // Generate secure token
    const resetToken = generateSecureToken()
    const hashedToken = hashToken(resetToken)
    const expiryDate = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

    // Store hashed token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: expiryDate,
        resetTokenUsed: false,
      },
    })

    // Generate reset link with plain token (not hashed)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const resetLink = `${appUrl}/reset-password/${resetToken}`

    // Send email
    const emailHtml = generatePasswordResetEmail(user.name, resetLink, 'ar')
    const emailSent = await sendEmail({
      to: user.email,
      subject: 'استعادة كلمة المرور - نظام إدارة الأملاك',
      html: emailHtml,
    })

    if (!emailSent) {
      console.error('[Forgot Password] Failed to send email to:', user.email)
      // Clean up the token if email failed
      await prisma.user.update({
        where: { id: user.id },
        data: {
          resetToken: null,
          resetTokenExpiry: null,
          resetTokenUsed: false,
        },
      })
      
      return NextResponse.json(
        { 
          error: 'Email service unavailable',
          message: 'Unable to send reset email. Please try again later or contact support.',
        },
        { status: 503 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'If your email is registered, you will receive a password reset link',
    })
  } catch (error) {
    console.error('[Forgot Password] Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
