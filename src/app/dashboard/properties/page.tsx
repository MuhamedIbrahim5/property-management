import { prisma } from '@/lib/prisma'
import PropertiesClient from './PropertiesClient'

// Force dynamic rendering - this page requires database access at request time
export const dynamic = 'force-dynamic'

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
