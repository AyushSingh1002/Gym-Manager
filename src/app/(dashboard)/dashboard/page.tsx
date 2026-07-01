"use client"

import { useState, useEffect } from "react"
import { Users, CalendarCheck, IndianRupee, CreditCard, AlertCircle, Activity, ArrowUp, ArrowDown } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { CardSkeleton } from "@/components/ui/skeleton"
import { formatCurrency, formatDateTime } from "@/lib/utils"

interface DashboardMetric {
  label: string
  value: string | number
}

interface DashboardData {
  metrics: {
    totalActiveMembers: DashboardMetric
    todayAttendance: DashboardMetric
    monthlyRevenue: DashboardMetric
    expiringMemberships: DashboardMetric
    pendingPayments: DashboardMetric
  }
  recentActivities: ActivityEntry[]
}

interface ActivityEntry {
  id: string
  action: string
  entity: string
  description: string
  createdAt: string
  admin: {
    id: string
    name: string
    email: string
  }
}

const metricConfig = [
  { key: "totalActiveMembers" as const, icon: Users, color: "bg-blue-500", lightColor: "bg-blue-50 dark:bg-blue-950" },
  { key: "todayAttendance" as const, icon: CalendarCheck, color: "bg-emerald-500", lightColor: "bg-emerald-50 dark:bg-emerald-950" },
  { key: "monthlyRevenue" as const, icon: IndianRupee, color: "bg-violet-500", lightColor: "bg-violet-50 dark:bg-violet-950" },
  { key: "expiringMemberships" as const, icon: CreditCard, color: "bg-amber-500", lightColor: "bg-amber-50 dark:bg-amber-950" },
  { key: "pendingPayments" as const, icon: AlertCircle, color: "bg-rose-500", lightColor: "bg-rose-50 dark:bg-rose-950" },
]

const activityIcons: Record<string, typeof Activity> = {
  CREATED: ArrowUp,
  UPDATED: Activity,
  DELETED: ArrowDown,
}

function getActivityIcon(action: string) {
  return activityIcons[action] || Activity
}

function getMetricValue(metric: DashboardMetric): string {
  if (metric.label.toLowerCase().includes("revenue")) {
    return formatCurrency(Number(metric.value))
  }
  return String(metric.value)
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboard() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch("/api/dashboard")
        if (!res.ok) {
          throw new Error(res.status === 401 ? "Unauthorized" : "Failed to fetch dashboard data")
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
          <p className="text-sm text-ink-muted mt-1">Loading your gym overview...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="mt-8">
          <Card>
            <CardHeader title="Recent Activity" />
            <CardContent>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="h-8 w-8 rounded-full bg-surface-2" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-3/4 rounded bg-surface-2" />
                      <div className="h-2 w-1/2 rounded bg-surface-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-semantic-error/10">
            <AlertCircle className="h-8 w-8 text-semantic-error" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink">Failed to load dashboard</h2>
          <p className="mt-2 text-sm text-ink-muted">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-2">
            <Activity className="h-8 w-8 text-ink-tertiary" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink">No data available</h2>
          <p className="mt-2 text-sm text-ink-muted">
            Your dashboard will populate once you start adding members and recording activity.
          </p>
        </div>
      </div>
    )
  }

  const { metrics, recentActivities } = data

  return (
    <div className="space-y-6">
      <div className="animate-fade-slide-up">
        <h1 className="text-2xl font-bold text-ink">Dashboard</h1>
        <p className="text-sm text-ink-muted mt-1">Overview of your gym</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {metricConfig.map(({ key, icon: Icon, color, lightColor }, index) => {
          const metric = metrics[key]
          return (
            <div
              key={key}
              className="animate-fade-slide-up"
              style={{ animationDelay: `${index * 100}ms`, animationFillMode: "backwards" }}
            >
              <Card hover>
                <CardContent>
                  <div className="flex items-start justify-between">
                    <div className={`rounded-lg p-2 ${lightColor}`}>
                      <Icon className={`h-5 w-5 text-ink`} />
                    </div>
                    <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
                  </div>
                  <div className="mt-4">
                    <p className="text-2xl font-bold text-ink">
                      {getMetricValue(metric)}
                    </p>
                    <p className="mt-1 text-xs text-ink-muted">{metric.label}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )
        })}
      </div>

      <div className="animate-fade-slide-up" style={{ animationDelay: "500ms", animationFillMode: "backwards" }}>
        <Card>
          <CardHeader title="Recent Activity" description="Latest actions across your gym" />
          <CardContent>
            {recentActivities.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Activity className="h-10 w-10 text-ink-tertiary" />
                <p className="mt-3 text-sm text-ink-muted">No recent activity</p>
              </div>
            ) : (
              <div className="divide-y divide-hairline">
                {recentActivities.map((activity) => {
                  const ActivityIcon = getActivityIcon(activity.action)
                  return (
                    <div key={activity.id} className="flex items-start gap-3 py-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2">
                        <ActivityIcon className="h-4 w-4 text-ink-muted" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-ink truncate">
                          {activity.description}
                        </p>
                        <p className="text-xs text-ink-muted mt-0.5">
                          by {activity.admin.name} &middot; {formatDateTime(activity.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
