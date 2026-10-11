'use client'

import { useEffect, useState } from 'react'
import { Building2, DoorOpen, Wrench, CheckCircle2 } from 'lucide-react'
import KPICard from '@/components/dashboard/KPICard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { useTranslation } from '@/hooks/useTranslation'

export const dynamic = 'force-dynamic'

type DashboardStats = {
  properties: number
  units: number
  totalRequests: number
  completedRequests: number
  recentRequests: Array<{
    id: string
    property: string
    unit: string
    issue: string
    status: string
    statusColor: string
    date: string
  }>
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text={t('common.loading')} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">{t('dashboard.title')}</h2>
        <p className="text-sm text-muted-foreground">{t('dashboard.overview')}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          title={t('dashboard.totalProperties')}
          value={stats.properties}
          icon={Building2}
          subtitle={t('dashboard.activeProperty')}
        />
        <KPICard
          title={t('dashboard.totalUnits')}
          value={stats.units}
          icon={DoorOpen}
          subtitle={t('dashboard.registeredUnit')}
        />
        <KPICard
          title={t('dashboard.maintenanceRequests')}
          value={stats.totalRequests}
          icon={Wrench}
          subtitle={t('dashboard.requestInSystem')}
          trend={{ value: 12, isPositive: false }}
        />
        <KPICard
          title={t('dashboard.completedRequests')}
          value={stats.completedRequests}
          icon={CheckCircle2}
          subtitle={`${Math.round((stats.completedRequests / stats.totalRequests) * 100)}% ${t('dashboard.ofTotal')}`}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.recentRequests')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats.recentRequests.map((request) => (
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
