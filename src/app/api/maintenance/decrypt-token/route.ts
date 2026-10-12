import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { decryptToken, checkRateLimit } from '@/lib/auth-helpers'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Rate limiting
    const rateLimitResult = checkRateLimit(`decrypt:${session.user.id}`, 20, 60000)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const { encryptedToken, requestId } = await request.json()
    
    if (!encryptedToken || !requestId) {
      return NextResponse.json(
        { error: 'Missing encryptedToken or requestId' },
        { status: 400 }
      )
    }

    // 3. Fetch and verify the maintenance request
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id: requestId }
    })

    if (!maintenanceRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      )
    }

    // 4. CRITICAL SECURITY CHECK: Verify that the provided encryptedToken 
    // matches the one stored in database for THIS specific request
    // This prevents using a valid token from one request to decrypt another
    if (maintenanceRequest.completionTokenPlain !== encryptedToken) {
      return NextResponse.json(
        { error: 'Invalid token for this request' },
        { status: 403 }
      )
    }

    // 5. Decrypt token only after verifying it belongs to this request
    const token = decryptToken(encryptedToken)
    
    if (!token) {
      return NextResponse.json(
        { error: 'Failed to decrypt token' },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ token })
  } catch (error) {
    console.error('Error in decrypt-token API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
