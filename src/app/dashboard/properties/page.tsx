import { prisma } from '@/lib/prisma'
import PropertiesClient from './PropertiesClient'

export default async function PropertiesPage() {
  const properties = await prisma.property.findMany({
    include: {
      units: true,
      _count: {
        select: {
          maintenanceRequests: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return <PropertiesClient initialProperties={properties} />
}
