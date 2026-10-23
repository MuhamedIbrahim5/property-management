import { prisma } from '@/lib/prisma'
import UnitsClient from './UnitsClient'

// Force dynamic rendering - this page requires database access at request time
export const dynamic = 'force-dynamic'

export default async function UnitsPage() {
  const [units, properties] = await Promise.all([
    prisma.unit.findMany({
      include: {
        property: true,
        _count: {
          select: {
            maintenanceRequests: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    }),
    prisma.property.findMany({
      where: { status: 'active' },
      orderBy: { name: 'asc' }
    })
  ])

  return <UnitsClient initialUnits={units} properties={properties} />
}
