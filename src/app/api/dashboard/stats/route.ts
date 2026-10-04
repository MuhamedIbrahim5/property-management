import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdminAuth } from '@/lib/auth-helpers'

export async function GET() {
  // Require admin authentication
  const auth = await requireAdminAuth()
  if (!auth.authorized) {
    return auth.response
  }

  try {
    const [properties, units, totalRequests, completedRequests, recentRequests] = await Promise.all([
      prisma.property.count(),
      prisma.unit.count(),
      prisma.maintenanceRequest.count(),
      prisma.maintenanceRequest.count({
        where: { statusId: 'status-4' } // مكتمل
      }),
      prisma.maintenanceRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          property: true,
          unit: true,
          status: true,
        },
      }),
    ])

    const formattedRequests = recentRequests.map(req => ({
      id: req.requestNumber,
      property: req.property.name,
      unit: req.unit ? req.unit.unitNumber : 'غير محدد',
      issue: req.issueDescription,
      status: req.status.name,
      statusColor: getStatusColor(req.status.name),
      date: req.createdAt.toISOString().split('T')[0],
    }))

    return NextResponse.json({
      stats: {
        properties,
        units,
        totalRequests,
        completedRequests,
      },
      recentRequests: formattedRequests,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}

function getStatusColor(statusName: string): string {
  const statusMap: Record<string, string> = {
    'جديد': 'default',
    'قيد المتابعة': 'default',
    'قيد التنفيذ': 'warning',
    'مكتمل': 'success',
    'ملغي': 'destructive',
  }
  return statusMap[statusName] || 'default'
}
