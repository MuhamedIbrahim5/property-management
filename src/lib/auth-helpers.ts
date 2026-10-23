import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

/**
 * Require admin authentication for API routes
 * Returns authorization result with user info or error response
 */
export async function requireAdminAuth() {
  const session = await getServerSession(authOptions)
  
  console.log('requireAdminAuth - Session:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
    userRole: session?.user?.role
  })
  
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
    console.log('requireAdminAuth - Role not allowed:', session.user.role)
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
 * Require technician or admin authentication for API routes
 * Returns authorization result with user info or error response
 */
export async function requireTechnicianAuth() {
  const session = await getServerSession(authOptions)
  
  console.log('requireTechnicianAuth - Session:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
    userRole: session?.user?.role
  })
  
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
  
  // Check if user has technician, manager, or admin role
  const allowedRoles = ['admin', 'manager', 'technician']
  if (!allowedRoles.includes(session.user.role)) {
    console.log('requireTechnicianAuth - Role not allowed:', session.user.role)
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Insufficient permissions. Technician access required.' }, 
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
 * Get current authenticated user (any role)
 * Returns user info or null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    return null
  }
  
  return session.user
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
 * Encrypt token for storage (AES-256-GCM)
 */
export function encryptToken(token: string): string {
  const crypto = require('crypto')
  const secret = process.env.NEXTAUTH_SECRET
  
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is not configured - encryption impossible')
  }
  
  // Create key from secret (32 bytes for AES-256)
  const key = crypto.createHash('sha256').update(secret).digest()
  
  // Generate IV
  const iv = crypto.randomBytes(16)
  
  // Create cipher
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv)
  
  // Encrypt
  let encrypted = cipher.update(token, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  // Get auth tag
  const authTag = cipher.getAuthTag()
  
  // Return IV + encrypted + authTag (hex format)
  return iv.toString('hex') + ':' + encrypted + ':' + authTag.toString('hex')
}

/**
 * Decrypt token from storage
 */
export function decryptToken(encryptedToken: string): string | null {
  try {
    const crypto = require('crypto')
    const secret = process.env.NEXTAUTH_SECRET
    
    if (!secret) {
      console.error('NEXTAUTH_SECRET missing - cannot decrypt token')
      return null
    }
    
    // Create key from secret
    const key = crypto.createHash('sha256').update(secret).digest()
    
    // Parse encrypted data
    const parts = encryptedToken.split(':')
    if (parts.length !== 3) return null
    
    const iv = Buffer.from(parts[0], 'hex')
    const encrypted = parts[1]
    const authTag = Buffer.from(parts[2], 'hex')
    
    // Create decipher
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(authTag)
    
    // Decrypt
    let decrypted = decipher.update(encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return decrypted
  } catch (error) {
    console.error('Token decryption error:', error)
    return null
  }
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
