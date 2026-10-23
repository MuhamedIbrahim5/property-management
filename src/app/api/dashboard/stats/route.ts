import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { 
  getLocalizedPropertyNameWithId,
  getLocalizedUnitNumberWithId,
  getLocalizedIssueDescription,
  translateStatus
} from '@/lib/data-translation'

// Force dynamic rendering - API requires database access at request time
export const dynamic = 'force-dynamic'

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

export async function GET() {
  try {
    // Get language from cookie
    const cookieStore = cookies()
    const languageCookie = cookieStore.get('language')
    const language = (languageCookie?.value === 'en' ? 'en' : 'ar') as 'ar' | 'en'

    const [properties, units, totalRequests, completedRequests, recentRequests] = await Promise.all([
      prisma.property.count(),
      prisma.unit.count(),
      prisma.maintenanceRequest.count(),
      prisma.maintenanceRequest.count({
        where: { 
          status: {
            isCompleted: true
          }
        }
      }),
      prisma.maintenanceRequest.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          property: {
            select: {
              id: true,
              name: true,
              nameEn: true,
            }
          },
          unit: {
            select: {
              id: true,
              unitNumber: true,
              unitNumberEn: true,
            }
          },
          status: true,
        },
      }),
    ])

    // Translate recent requests with error handling
    const formattedRequests = await Promise.all(
      recentRequests.map(async (req) => {
        try {
          const [propertyName, unitNumber, issueDescription] = await Promise.all([
            getLocalizedPropertyNameWithId(
              req.property.id,
              req.property.name,
              req.property.nameEn,
              language
            ).catch(() => req.property.name), // Fallback to original on error
            req.unit
              ? getLocalizedUnitNumberWithId(
                  req.unit.id,
                  req.unit.unitNumber,
                  req.unit.unitNumberEn,
                  language
                ).catch(() => req.unit!.unitNumber) // Fallback to original on error
              : Promise.resolve(language === 'ar' ? 'غير محدد' : 'Not specified'),
            getLocalizedIssueDescription(req.issueDescription, language)
              .catch(() => req.issueDescription), // Fallback to original on error
          ])

          return {
            id: req.requestNumber,
            property: propertyName,
            unit: unitNumber,
            issue: issueDescription,
            status: translateStatus(req.status.name, language),
            statusColor: getStatusColor(req.status.name),
            date: req.createdAt.toISOString().split('T')[0],
          }
        } catch (error) {
          // Fallback: return request without translation if all fails
          console.error('Error formatting request:', req.requestNumber, error)
          return {
            id: req.requestNumber,
            property: req.property.name,
            unit: req.unit ? req.unit.unitNumber : (language === 'ar' ? 'غير محدد' : 'Not specified'),
            issue: req.issueDescription,
            status: req.status.name,
            statusColor: getStatusColor(req.status.name),
            date: req.createdAt.toISOString().split('T')[0],
          }
        }
      })
    )

    return NextResponse.json({
      properties,
      units,
      totalRequests,
      completedRequests,
      recentRequests: formattedRequests,
    })
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}
