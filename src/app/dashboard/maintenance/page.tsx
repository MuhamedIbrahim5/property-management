import { prisma } from '@/lib/prisma'
import MaintenanceClient from './MaintenanceClient'

export default async function MaintenancePage() {
  const [requests, statuses, types, users] = await Promise.all([
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.maintenanceStatus.findMany({ orderBy: { order: 'asc' } }),
    prisma.maintenanceType.findMany({ orderBy: { name: 'asc' } }),
    prisma.user.findMany({
      select: { id: true, name: true },
      orderBy: { name: 'asc' }
    })
  ])

  return <MaintenanceClient initialRequests={requests} statuses={statuses} types={types} users={users} />
}
