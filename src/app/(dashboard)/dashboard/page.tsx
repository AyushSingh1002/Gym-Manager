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
      <main>
        <div className="space-y-6 sm:space-y-8">
          <div className="space-y-1.5 sm:space-y-2 pt-2 sm:pt-0">
            <div className="h-6 sm:h-8 w-32 sm:w-40 rounded-lg bg-surface-2 animate-pulse" />
            <div className="h-3 sm:h-4 w-40 sm:w-56 rounded-lg bg-surface-2 animate-pulse" />
          </div>
          <div className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
          <div>
            <Card variant="elevated">
              <CardHeader title="Recent Activity" />
              <CardContent>
                <div className="space-y-2 sm:space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-8 sm:h-9 w-8 sm:w-9 rounded-full bg-surface-2 animate-pulse flex-shrink-0" />
                      <div className="flex-1 space-y-1.5 sm:space-y-2">
                        <div className="h-3 sm:h-4 w-3/4 rounded-lg bg-surface-2 animate-pulse" />
                        <div className="h-2.5 sm:h-3 w-1/2 rounded-lg bg-surface-2 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="py-12 flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-semantic-error/10 mb-4">
            <AlertCircle className="h-10 w-10 text-semantic-error" />
          </div>
          <h2 className="text-xl font-semibold text-ink-primary">Failed to load dashboard</h2>
          <p className="mt-2 text-sm text-ink-tertiary">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-primary px-5 py-2.5 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
          >
            Try again
          </button>
        </div>
      </main>
    )
  }

  if (!data) {
    return (
      <main className="py-12 flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-2 mb-4">
            <Activity className="h-10 w-10 text-ink-subtle" />
          </div>
          <h2 className="text-xl font-semibold text-ink-primary">No data available</h2>
          <p className="mt-2 text-sm text-ink-tertiary">
            Your dashboard will populate once you start adding members and recording activity.
          </p>
        </div>
      </main>
    )
  }

  const { metrics, recentActivities } = data

  return (
    <main>
      <div className="space-y-6 sm:space-y-8 animate-fade-slide-up">
        <div className="pt-2 sm:pt-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-ink-primary leading-tight">Dashboard</h1>
          <p className="text-xs sm:text-sm text-ink-subtle mt-1.5 sm:mt-2">Welcome back! Here&apos;s your gym&apos;s overview.</p>
        </div>

        <div className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {metricConfig.map(({ key, icon: Icon, color, lightColor }, index) => {
            const metric = metrics[key]
            return (
              <div
                key={key}
                className="animate-fade-slide-up"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
              >
                <Card interactive variant="elevated">
                  <div className="flex items-start justify-between mb-3 sm:mb-4">
                    <div className={`rounded-[var(--radius-md)] p-2 sm:p-3 ${lightColor}`}>
                      <Icon className={`h-4 sm:h-5 w-4 sm:w-5 text-ink`} />
                    </div>
                    <span className={`inline-block h-2 sm:h-2.5 w-2 sm:w-2.5 rounded-full ${color}`} />
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-ink-primary leading-tight">
                      {getMetricValue(metric)}
                    </p>
                    <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-xs font-medium text-ink-tertiary line-clamp-2">{metric.label}</p>
                  </div>
                </Card>
              </div>
            )
          })}
        </div>

        <div className="animate-fade-slide-up" style={{ animationDelay: "250ms", animationFillMode: "backwards" }}>
          <Card variant="elevated">
            <CardHeader title="Recent Activity" description="Latest actions across your gym" />
            <CardContent>
              {recentActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mb-3">
                    <Activity className="h-6 w-6 text-ink-subtle" />
                  </div>
                  <p className="text-sm text-ink-tertiary">No recent activity yet</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {recentActivities.map((activity, idx) => {
                    const ActivityIcon = getActivityIcon(activity.action)
                    return (
                      <div 
                        key={activity.id} 
                        className="flex items-start gap-3 p-3 rounded-[var(--radius-md)] hover:bg-surface-2 transition-colors group"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 group-hover:bg-primary/10 transition-colors flex-shrink-0">
                          <ActivityIcon className={`h-4 w-4 ${activity.action === "CREATED" ? "text-semantic-success" : activity.action === "DELETED" ? "text-semantic-error" : "text-ink-tertiary"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink-primary truncate">
                            {activity.description}
                          </p>
                          <p className="text-xs text-ink-subtle mt-1">
                            {activity.admin.name} &middot; {formatDateTime(activity.createdAt)}
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
    </main>
  )
}
