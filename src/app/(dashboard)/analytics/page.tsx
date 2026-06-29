"use client"

import { useState, useEffect } from "react"
import { BarChart3, TrendingUp, Users, IndianRupee, Target } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { CardSkeleton } from "@/components/ui/skeleton"
import { formatCurrency } from "@/lib/utils"

interface MonthlyRevenue {
  month: string
  revenue: number
}

interface MemberGrowth {
  month: string
  new: number
  total: number
}

interface AttendanceTrend {
  date: string
  count: number
}

interface PlanDistribution {
  name: string
  count: number
  percentage: number
}

interface ActiveInactive {
  active: number
  inactive: number
  ratio: number
}

interface AnalyticsData {
  monthlyRevenue: MonthlyRevenue[]
  memberGrowth: MemberGrowth[]
  attendanceTrend: AttendanceTrend[]
  planDistribution: PlanDistribution[]
  activeInactive: ActiveInactive
}

const planLabels: Record<string, string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  HALF_YEARLY: "Half Yearly",
  YEARLY: "Yearly",
}

const planColors: Record<string, string> = {
  MONTHLY: "bg-blue-500",
  QUARTERLY: "bg-purple-500",
  HALF_YEARLY: "bg-amber-500",
  YEARLY: "bg-emerald-500",
}

function getMaxValue(arr: { value: number }[]): number {
  const max = Math.max(...arr.map((d) => d.value), 1)
  return max
}

function DonutChart({ active, inactive, ratio }: { active: number; inactive: number; ratio: number }) {
  const circumference = 2 * Math.PI * 40
  const activeOffset = circumference * (1 - ratio / 100)

  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" className="dark:stroke-gray-700" />
        <circle
          cx="50"
          cy="50"
          r="40"
          fill="none"
          stroke="#22c55e"
          strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={activeOffset}
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          className="dark:stroke-emerald-500"
        />
        <text x="50" y="46" textAnchor="middle" className="fill-gray-900 dark:fill-gray-100" fontSize="16" fontWeight="bold">
          {Math.round(ratio)}%
        </text>
        <text x="50" y="60" textAnchor="middle" className="fill-gray-500 dark:fill-gray-400" fontSize="8">
          Active
        </text>
      </svg>
      <div className="flex items-center gap-6 mt-2">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Active ({active})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Inactive ({inactive})</span>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch("/api/analytics")
        if (!res.ok) {
          throw new Error(res.status === 401 ? "Unauthorized" : "Failed to fetch analytics data")
        }
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Loading your gym&apos;s performance...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <CardSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
            <BarChart3 className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load analytics</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  if (!data) return null

  const { monthlyRevenue, memberGrowth, attendanceTrend, planDistribution, activeInactive } = data

  const totalMembers = memberGrowth.length > 0 ? memberGrowth[memberGrowth.length - 1].total : 0
  const activeMembers = activeInactive.active
  const totalRevenue = monthlyRevenue.reduce((sum, m) => sum + m.revenue, 0)
  const avgRevenuePerMember = totalMembers > 0 ? Math.round(totalRevenue / totalMembers) : 0

  const summaryCards = [
    { label: "Total Members", value: totalMembers, icon: Users, color: "bg-blue-500", lightColor: "bg-blue-50 dark:bg-blue-950" },
    { label: "Active Members", value: activeMembers, icon: Target, color: "bg-emerald-500", lightColor: "bg-emerald-50 dark:bg-emerald-950" },
    { label: "Total Revenue (All Time)", value: formatCurrency(totalRevenue), icon: IndianRupee, color: "bg-violet-500", lightColor: "bg-violet-50 dark:bg-violet-950" },
    { label: "Avg Revenue Per Member", value: formatCurrency(avgRevenuePerMember), icon: TrendingUp, color: "bg-amber-500", lightColor: "bg-amber-50 dark:bg-amber-950" },
  ]

  const maxRevenue = getMaxValue(monthlyRevenue.map((m) => ({ value: m.revenue })))
  const maxGrowth = getMaxValue(memberGrowth.map((m) => ({ value: m.new })))
  const maxAttendance = getMaxValue(attendanceTrend.map((d) => ({ value: d.count })))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your gym&apos;s performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map(({ label, value, icon: Icon, color, lightColor }) => (
          <Card key={label} hover>
            <CardContent>
              <div className="flex items-start justify-between">
                <div className={`rounded-lg p-2 ${lightColor}`}>
                  <Icon className={`h-5 w-5 ${color.replace("bg-", "text-")}`} />
                </div>
                <span className={`inline-block h-2 w-2 rounded-full ${color}`} />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Monthly Revenue" description="Last 6 months" />
          <CardContent>
            <div className="flex items-end justify-between gap-2 h-48">
              {monthlyRevenue.map((item) => {
                const height = maxRevenue > 0 ? (item.revenue / maxRevenue) * 100 : 0
                return (
                  <div key={item.month} className="flex-1 flex flex-col items-center gap-1.5">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      {formatCurrency(item.revenue)}
                    </span>
                    <div className="w-full flex justify-center" style={{ height: "160px" }}>
                      <div
                        className="w-3/4 rounded-t-md bg-gradient-to-t from-indigo-500 to-indigo-400 dark:from-indigo-600 dark:to-indigo-500 transition-all duration-500 self-end"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.month}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Member Growth" description="New members per month" />
          <CardContent>
            <div className="relative h-48">
              <svg className="w-full h-full" viewBox="0 0 300 160" preserveAspectRatio="none">
                <polyline
                  points={memberGrowth
                    .map((item, i) => {
                      const x = (i / (memberGrowth.length - 1)) * 280 + 10
                      const y = maxGrowth > 0 ? 150 - (item.new / maxGrowth) * 130 : 150
                      return `${x},${y}`
                    })
                    .join(" ")}
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="dark:stroke-indigo-400"
                />
                {memberGrowth.map((item, i) => {
                  const cx = (i / (memberGrowth.length - 1)) * 280 + 10
                  const cy = maxGrowth > 0 ? 150 - (item.new / maxGrowth) * 130 : 150
                  return <circle key={item.month} cx={cx} cy={cy} r="4" fill="#6366f1" className="dark:fill-indigo-400" />
                })}
              </svg>
              <div className="flex justify-between mt-1">
                {memberGrowth.map((item) => (
                  <div key={item.month} className="flex flex-col items-center">
                    <span className="text-xs font-medium text-gray-900 dark:text-gray-100">{item.new}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{item.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader title="Attendance Trend" description="Last 30 days" />
        <CardContent>
          <div className="flex items-end gap-[3px] h-40">
            {attendanceTrend.map((item) => {
              const height = maxAttendance > 0 ? (item.count / maxAttendance) * 100 : 0
              return (
                <div
                  key={item.date}
                  className="flex-1 relative group"
                >
                  <div
                    className="w-full rounded-t-sm bg-gradient-to-t from-emerald-500 to-emerald-400 dark:from-emerald-600 dark:to-emerald-500 transition-all duration-300"
                    style={{ height: `${height}%` }}
                  />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10">
                    <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs rounded px-2 py-1 whitespace-nowrap">
                      {item.date}: {item.count}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-xs text-gray-500 dark:text-gray-400">{attendanceTrend[0]?.date}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{attendanceTrend[attendanceTrend.length - 1]?.date}</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Plan Distribution" description="Members by plan type" />
          <CardContent>
            <div className="space-y-4">
              {planDistribution.map((plan) => (
                <div key={plan.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {planLabels[plan.name] || plan.name}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {plan.count} ({plan.percentage}%)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${planColors[plan.name] || "bg-gray-500"}`}
                      style={{ width: `${plan.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Active vs Inactive" description="Member status ratio" />
          <CardContent>
            <DonutChart active={activeInactive.active} inactive={activeInactive.inactive} ratio={activeInactive.ratio} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
