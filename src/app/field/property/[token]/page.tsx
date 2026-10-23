import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import FieldVisitClient from './FieldVisitClient'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { token: string }
}

export default async function FieldVisitPage({ params }: PageProps) {
  const { token } = params

  // 1. AUTHENTICATION CHECK - User must be logged in
  const session = await getServerSession(authOptions)
  
  if (!session?.user?.id) {
    // This should not happen because middleware already protects this route
    // But we check again for defense in depth
    notFound()
  }

  // 2. AUTHORIZATION CHECK - User must have appropriate role
  const allowedRoles = ['admin', 'manager', 'technician']
  if (!allowedRoles.includes(session.user.role)) {
    // User doesn't have permission to access field visits
    notFound()
  }

  // 3. Verify token and get property
  const property = await prisma.property.findUnique({
    where: { qrToken: token },
    select: {
      id: true,
      name: true,
      nameEn: true,
      neighborhood: true,
      neighborhoodEn: true,
      address: true,
      latitude: true,
      longitude: true,
      status: true
    }
  })

  if (!property || property.status !== 'active') {
    notFound()
  }

  // 4. Get open maintenance requests for this property
  // Only show requests that are relevant to this user
  let requestWhere: any = {
    propertyId: property.id,
    status: {
      isCompleted: false
    }
  }

  // If technician, only show requests assigned to them
  if (session.user.role === 'technician') {
    requestWhere.assigneeId = session.user.id
  }

  const requests = await prisma.maintenanceRequest.findMany({
    where: requestWhere,
    select: {
      id: true,
      requestNumber: true,
      issueDescription: true,
      priority: true,
      createdAt: true,
      type: {
        select: {
          name: true
        }
      },
      status: {
        select: {
          name: true
        }
      },
      unit: {
        select: {
          unitNumber: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  return (
    <FieldVisitClient 
      property={property} 
      requests={requests}
      token={token}
      userId={session.user.id}
      userName={session.user.name}
      userRole={session.user.role}
    />
  )
}
