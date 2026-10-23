export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/field/:path*' // Protect field visit pages - require authentication
  ]
}
