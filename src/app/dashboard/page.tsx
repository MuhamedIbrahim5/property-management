import { Building2, DoorOpen, Wrench, CheckCircle2 } from 'lucide-react'
import KPICard from '@/components/dashboard/KPICard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

export default async function DashboardPage() {
  const [properties, units, totalRequests, completedRequests, recentRequests] = await Promise.all([
    prisma.property.count(),
    prisma.unit.count(),
    prisma.maintenanceRequest.count(),
    prisma.maintenanceRequest.count({
      where: { statusId: 'status-4' }
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

  const stats = {
    properties,
    units,
    totalRequests,
    completedRequests,
  }

  const formattedRequests = recentRequests.map(req => ({
    id: req.requestNumber,
    property: req.property.name,
    unit: req.unit ? req.unit.unitNumber : 'غير محدد',
    issue: req.issueDescription,
    status: req.status.name,
    statusColor: getStatusColor(req.status.name),
    date: req.createdAt.toISOString().split('T')[0],
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">لوحة التحكم</h2>
        <p className="text-sm text-muted-foreground">نظرة عامة على النظام</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title="إجمالي العقارات"
          value={stats.properties}
          icon={Building2}
          subtitle="عقار نشط"
        />
        <KPICard
          title="إجمالي الوحدات"
          value={stats.units}
          icon={DoorOpen}
          subtitle="وحدة مسجلة"
        />
        <KPICard
          title="بلاغات الصيانة"
          value={stats.totalRequests}
          icon={Wrench}
          subtitle="بلاغ في النظام"
          trend={{ value: 12, isPositive: false }}
        />
        <KPICard
          title="البلاغات المكتملة"
          value={stats.completedRequests}
          icon={CheckCircle2}
          subtitle={`${Math.round((stats.completedRequests / stats.totalRequests) * 100)}% من الإجمالي`}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>آخر البلاغات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formattedRequests.map((request: any) => (
              <div
                key={request.id}
                className="flex items-start justify-between border-b border-border pb-4 last:border-0 last:pb-0"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm text-foreground">{request.id}</p>
                    <Badge variant={request.statusColor as any}>{request.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-foreground">{request.issue}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {request.property} - {request.unit}
                  </p>
                </div>
                <div className="text-left">
                  <p className="text-xs text-muted-foreground">{request.date}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
