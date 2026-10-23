/**
 * Request helper utilities for API routes
 * 
 * SECURITY WARNING:
 * This module trusts X-Forwarded-For and X-Real-IP headers.
 * These headers are ONLY trustworthy when the application is deployed behind
 * a trusted reverse proxy (Vercel, Cloudflare, nginx).
 * 
 * DO NOT use in development or on servers directly exposed to the internet
 * without a trusted proxy, as clients can spoof these headers to bypass rate limiting.
 * 
 * Recommended deployment: Vercel, Cloudflare Workers, or behind nginx/Caddy
 */

/**
 * Extract client IP address from request headers
 * Checks common proxy headers first, falls back to connection info
 * 
 * SECURITY: Trusts X-Forwarded-For header - ONLY safe with trusted proxy!
 * Assumes deployment behind Vercel/Cloudflare/nginx
 */
export function getClientIP(request: Request): string {
  // Check Vercel/Cloudflare/nginx headers
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Take first IP if multiple (client IP is first in chain)
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP.trim()
  }

  // Fallback to 'unknown' if no IP found
  // In production with proper proxy setup, this shouldn't happen
  return 'unknown'
}

/**
 * Generate rate limit identifier from request
 * Uses IP address as primary identifier
 */
export function getRateLimitIdentifier(request: Request, prefix: string = ''): string {
  const ip = getClientIP(request)
  return prefix ? `${prefix}:${ip}` : ip
}
