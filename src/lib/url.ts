/**
 * Get the application base URL
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL environment variable
 * 2. window.location.origin (client-side fallback for development)
 * 3. Default production URL
 */
export function getAppUrl(): string {
  // Server-side or build-time
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_APP_URL || 'https://property-management-mocha.vercel.app'
  }
  
  // Client-side
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL
  }
  
  // Development fallback
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return window.location.origin
  }
  
  // Production fallback
  return 'https://property-management-mocha.vercel.app'
}

/**
 * Build a full URL for the application
 */
export function buildAppUrl(path: string): string {
  const baseUrl = getAppUrl()
  const cleanPath = path.startsWith('/') ? path : `/${path}`
  return `${baseUrl}${cleanPath}`
}
