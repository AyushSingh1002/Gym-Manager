"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Dumbbell, CreditCard, CalendarCheck, IndianRupee, ChevronRight, TrendingUp, Award, Zap, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDate, formatCurrency, getDaysRemaining, getPlanLabel, getStatusColor } from "@/lib/utils"

interface RecentAttendance {
  id: string
  date: string
  checkIn: string
  checkOut: string | null
}

interface RecentPayment {
  id: string
  receiptNo: string
  amount: number
  method: string
  status: string
  date: string
}

interface DashboardData {
  member: { firstName: string; lastName: string; status: string }
  currentMembership: { plan: string; startDate: string; endDate: string; daysRemaining: number } | null
  todayAttendance: boolean
  monthAttendanceCount: number
  activeMembership: { plan: string; startDate: string; endDate: string } | null
  recentPayments: RecentPayment[]
  unreadNotifications: number
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-hairline bg-surface-1 p-6 animate-pulse">
      <div className="h-4 w-24 bg-surface-2 rounded mb-3" />
      <div className="h-8 w-32 bg-surface-2 rounded mb-2" />
      <div className="h-3 w-20 bg-surface-2 rounded" />
    </div>
  )
}

function GradientCard({
  icon: Icon,
  label,
  value,
  subtext,
  gradient,
  glow,
  children,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  subtext?: string
  gradient?: string
  glow?: string
  children?: React.ReactNode
}) {
  return (
    <div
      className={`relative rounded-xl border border-hairline/50 p-6 dark:bg-surface-1 overflow-hidden transition-all duration-300 hover:shadow-md ${
        gradient || "bg-surface-1"
      }`}
      style={glow ? { boxShadow: `0 0 24px ${glow}` } : undefined}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-ink-muted">{label}</p>
          <p className="text-3xl font-bold tracking-tight text-ink">{value}</p>
          {subtext && <p className="text-xs text-ink-tertiary">{subtext}</p>}
        </div>
        <div className="rounded-xl bg-indigo-500/10 p-3 dark:bg-indigo-400/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
      </div>
      {children}
    </div>
  )
}

function getStatusGradient(status: string | undefined): string {
  if (status === "ACTIVE") return "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white"
  if (status === "EXPIRED") return "bg-gradient-to-br from-red-500 to-red-700 text-white"
  return "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
}

export default function MemberDashboard() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [recentAttendance, setRecentAttendance] = useState<RecentAttendance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const [dashboardRes, attendanceRes] = await Promise.all([
        fetch("/api/member/dashboard"),
        fetch("/api/member/attendance?page=1&limit=3"),
      ])

      if (!dashboardRes.ok) {
        if (dashboardRes.status === 401) { router.push("/member/login"); return }
        throw new Error("Failed to load dashboard data")
      }

      const dashboardData: DashboardData = await dashboardRes.json()
      setData(dashboardData)

      if (attendanceRes.ok) {
        const attendanceData = await attendanceRes.json()
        setRecentAttendance(attendanceData.attendance || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (date: Date) =>
    date.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })

  const formatDateStr = (date: Date) =>
    date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-surface-2 rounded" />
          <div className="h-4 w-48 bg-surface-2 rounded" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
        <div className="rounded-full bg-semantic-error/10 border-semantic-error/20 p-4">
          <AlertCircle className="h-8 w-8 text-semantic-error" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-ink">Failed to load dashboard</h3>
        <p className="mt-1 text-sm text-ink-muted">{error}</p>
        <Button onClick={fetchData} className="mt-4">
          Try Again
        </Button>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
        <Dumbbell className="h-12 w-12 text-ink-tertiary" />
        <h3 className="mt-4 text-lg font-semibold text-ink">No data available</h3>
        <p className="mt-1 text-sm text-ink-muted">Your dashboard will appear here once you have an active membership.</p>
      </div>
    )
  }

  const { member, currentMembership, todayAttendance, monthAttendanceCount, recentPayments } = data
  const daysRemaining = currentMembership ? getDaysRemaining(new Date(currentMembership.endDate)) : 0
  const progressPercent = Math.min((monthAttendanceCount / 30) * 100, 100)

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-ink">
            Welcome back, {member.firstName}
          </h1>
          <p className="mt-1 text-sm text-ink-muted">
            {formatDateStr(currentTime)} &middot; {formatTime(currentTime)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {currentMembership ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {getPlanLabel(currentMembership.plan)} - Active
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              No Active Plan
            </span>
          )}
        </div>
      </div>

      {/* Motivational Message */}
      <div className="rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-4 text-white">
        <div className="flex items-center gap-3">
          <Zap className="h-6 w-6 text-yellow-300 shrink-0" />
          <p className="text-sm font-medium">
            {currentMembership && daysRemaining > 0
              ? `${daysRemaining} days left in your membership — make every rep count!`
              : "Start your fitness journey today — get a membership and crush your goals!"}
          </p>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Membership Status Card */}
        <div
          className={`relative rounded-xl p-6 transition-all duration-300 hover:shadow-md cursor-pointer ${getStatusGradient(
            currentMembership ? "ACTIVE" : "EXPIRED"
          )}`}
          onClick={() => router.push("/member/membership")}
        >
          <div className="absolute top-0 right-0 w-32 h-32 translate-x-8 -translate-y-8 opacity-10">
            <Award className="w-full h-full" />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-medium opacity-80">Membership</p>
            <p className="mt-1 text-4xl font-bold">{daysRemaining}</p>
            <p className="text-xs opacity-80">days remaining</p>
            <div className="mt-3 flex items-center gap-2">
              <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
                {currentMembership ? getPlanLabel(currentMembership.plan) : "Expired"}
              </span>
              {currentMembership && (
                <span className="text-xs opacity-80">
                  until {formatDate(new Date(currentMembership.endDate))}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Today's Attendance */}
        <GradientCard
          icon={CalendarCheck}
          label="Today's Attendance"
          value={todayAttendance ? "Checked In" : "Not Yet"}
          subtext={todayAttendance ? "Great job staying consistent!" : "You haven't checked in today"}
          gradient={todayAttendance ? "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/30 dark:to-emerald-900/30" : undefined}
          glow={todayAttendance ? "rgba(16, 185, 129, 0.15)" : undefined}
        />

        {/* This Month */}
        <GradientCard
          icon={TrendingUp}
          label="This Month"
          value={`${monthAttendanceCount} of 30`}
          subtext={`${Math.round(progressPercent)}% attendance rate`}
        >
          <div className="mt-4 w-full bg-surface-2 rounded-full h-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </GradientCard>

        {/* Quick Actions */}
        <div className="rounded-xl border border-hairline/50 bg-surface-1 p-6">
          <p className="text-sm font-medium text-ink-muted mb-4">Quick Actions</p>
          <div className="space-y-2">
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => router.push("/member/membership")}
            >
              <Award className="h-4 w-4 mr-2" />
              View Membership
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => router.push("/member/payments")}
            >
              <IndianRupee className="h-4 w-4 mr-2" />
              Make Payment
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start text-sm"
              onClick={() => router.push("/member/attendance")}
            >
              <CalendarCheck className="h-4 w-4 mr-2" />
              View Attendance
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Activity Section */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Payments */}
        <div className="rounded-xl border border-hairline/50 bg-surface-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-ink">Recent Payments</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => router.push("/member/payments")}
            >
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          {recentPayments.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <IndianRupee className="h-8 w-8 text-ink-tertiary mb-2" />
              <p className="text-sm text-ink-muted">No payments yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPayments.slice(0, 3).map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between rounded-lg bg-surface-2 p-3 transition-colors hover:bg-surface-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-indigo-500/10 p-2 dark:bg-indigo-400/10">
                      {payment.status === "PAID" ? (
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Clock className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {formatCurrency(payment.amount)}
                      </p>
                      <p className="text-xs text-ink-muted">
                        {formatDate(new Date(payment.date))}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      getStatusColor(payment.status)
                    }`}
                  >
                    {payment.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Attendance */}
        <div className="rounded-xl border border-hairline/50 bg-surface-1 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-ink">Recent Attendance</h3>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs"
              onClick={() => router.push("/member/attendance")}
            >
              View All <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
          {recentAttendance.length === 0 ? (
            <div className="flex flex-col items-center py-6 text-center">
              <CalendarCheck className="h-8 w-8 text-ink-tertiary mb-2" />
              <p className="text-sm text-ink-muted">No attendance records this month</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAttendance.slice(0, 3).map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg bg-surface-2 p-3 transition-colors hover:bg-surface-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-emerald-500/10 p-2 dark:bg-emerald-400/10">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {formatDate(new Date(record.date))}
                      </p>
                      <p className="text-xs text-ink-muted">
                        In: {new Date(record.checkIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        {record.checkOut && (
                          <> &middot; Out: {new Date(record.checkOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <Dumbbell className="h-4 w-4 text-ink-tertiary" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
