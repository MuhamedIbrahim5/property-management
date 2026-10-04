import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * Require admin authentication for API routes
 * Returns authorization result with user info or error response
 */
export async function requireAdminAuth() {
  const session = await getServerSession(authOptions)
  
  // Check if user is authenticated
  if (!session?.user?.id) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Authentication required' }, 
        { status: 401 }
      )
    }
  }
  
  // Check if user has admin/manager role
  const allowedRoles = ['admin', 'manager']
  if (!allowedRoles.includes(session.user.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Insufficient permissions. Admin or manager role required.' }, 
        { status: 403 }
      )
    }
  }
  
  return {
    authorized: true,
    user: session.user
  }
}

/**
 * Simple in-memory rate limiting (for basic protection)
 * Note: This resets on server restart and doesn't work across regions
 * For production, consider using Upstash Redis or similar
 */
const attempts = new Map<string, { count: number; resetAt: number }>()

export function checkRateLimit(
  identifier: string, 
  maxAttempts = 5, 
  windowMs = 10 * 60 * 1000 // 10 minutes
): { allowed: boolean; remaining?: number } {
  const now = Date.now()
  const record = attempts.get(identifier)
  
  // Clean up expired records
  if (record && now > record.resetAt) {
    attempts.delete(identifier)
  }
  
  // No record or expired = allow
  if (!record || now > record.resetAt) {
    attempts.set(identifier, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1 }
  }
  
  // Check if limit exceeded
  if (record.count >= maxAttempts) {
    return { allowed: false }
  }
  
  // Increment and allow
  record.count++
  return { allowed: true, remaining: maxAttempts - record.count }
}

/**
 * Generate secure completion token for maintenance requests
 */
export function generateCompletionToken(): { token: string; hash: string } {
  const crypto = require('crypto')
  const token = crypto.randomBytes(32).toString('hex') // 64 characters
  const hash = crypto.createHash('sha256').update(token).digest('hex')
  
  return { token, hash }
}

/**
 * Hash a completion token for comparison
 */
export function hashCompletionToken(token: string): string {
  const crypto = require('crypto')
  return crypto.createHash('sha256').update(token).digest('hex')
}

/**
 * Check if completion token is expired (30 days)
 */
export function isCompletionTokenExpired(createdAt: Date): boolean {
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  return diffInDays > 30
}
