import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MaintenanceClient from './MaintenanceClient'

export const dynamic = 'force-dynamic'

export default async function MaintenancePage() {
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    redirect('/login')
  }

  const [requests, statuses, types] = await Promise.all([
    prisma.maintenanceRequest.findMany({
      include: {
        property: true,
        unit: true,
        type: true,
        status: true,
        assignee: {
          select: {
            id: true,
            name: true,
          },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            filePath: true,
            fileType: true,
            createdAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.maintenanceStatus.findMany({ orderBy: { order: 'asc' } }),
    prisma.maintenanceType.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <MaintenanceClient 
      initialRequests={requests} 
      statuses={statuses} 
      types={types}
    />
  )
}