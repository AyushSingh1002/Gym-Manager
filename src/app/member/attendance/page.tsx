"use client"
import { useState, useEffect } from "react"
import { CalendarCheck, ChevronLeft, ChevronRight, Clock, CheckCircle, X, TrendingUp, Award, Flame } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDate, formatDateTime } from "@/lib/utils"

interface AttendanceRecord {
  id: string
  date: string
  checkIn: string
  checkOut: string | null
}

interface AttendanceData {
  attendance: AttendanceRecord[]
  total: number
  summary: {
    totalDays: number
    thisMonth: number
  }
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTH_LABELS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

function getDayName(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", { weekday: "long" })
}

function getTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
}

function SkeletonAttendance() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-gray-200 dark:bg-gray-700 p-6 h-24" />
        ))}
      </div>
      <div className="rounded-xl bg-gray-200 dark:bg-gray-700 p-6 h-80" />
      <div className="rounded-xl bg-gray-200 dark:bg-gray-700 p-6 h-48" />
    </div>
  )
}

export default function MemberAttendance() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [summary, setSummary] = useState({ totalDays: 0, thisMonth: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const now = new Date()
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)
  const [viewYear, setViewYear] = useState(now.getFullYear())
  const [streak, setStreak] = useState(0)

  useEffect(() => {
    fetchAttendance()
  }, [viewMonth, viewYear])

  useEffect(() => {
    if (attendance.length > 0) {
      calculateStreak()
    }
  }, [attendance])

  async function fetchAttendance() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/member/attendance?month=${viewMonth}&year=${viewYear}&page=1&limit=31`)
      if (!res.ok) throw new Error("Failed to load attendance")
      const data: AttendanceData = await res.json()
      setAttendance(data.attendance || [])
      setSummary(data.summary || { totalDays: 0, thisMonth: 0 })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function calculateStreak() {
    const sorted = [...attendance]
      .filter((a) => new Date(a.date) <= new Date())
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (sorted.length === 0) { setStreak(0); return }

    let count = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const latestDate = new Date(sorted[0].date)
    latestDate.setHours(0, 0, 0, 0)

    const diffDays = Math.round((today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays > 1) { setStreak(0); return }

    const attendedDates = new Set(sorted.map((a) => {
      const d = new Date(a.date)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }))

    let checkDate = new Date(today)
    while (true) {
      const key = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`
      if (attendedDates.has(key)) {
        count++
        checkDate.setDate(checkDate.getDate() - 1)
      } else {
        if (checkDate.getDay() === 0) { count++; checkDate.setDate(checkDate.getDate() - 1); continue }
        break
      }
    }

    setStreak(count)
  }

  function navigateMonth(dir: number) {
    if (dir < 0 && viewMonth === 1) {
      setViewMonth(12)
      setViewYear(viewYear - 1)
    } else if (dir > 0 && viewMonth === 12) {
      setViewMonth(1)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + dir)
    }
  }

  function buildCalendar() {
    const firstDay = new Date(viewYear, viewMonth - 1, 1)
    const daysInMonth = new Date(viewYear, viewMonth, 0).getDate()
    const startDayOfWeek = firstDay.getDay()
    const today = new Date()

    const attendedDates = new Set(attendance.map((a) => {
      const d = new Date(a.date)
      return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    }))

    const cells: { day: number; isCurrentMonth: boolean; isToday: boolean; attended: boolean; isFuture: boolean }[] = []

    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ day: 0, isCurrentMonth: false, isToday: false, attended: false, isFuture: false })
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(viewYear, viewMonth - 1, d)
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
      const isToday =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
      const isFuture = date > today
      cells.push({
        day: d,
        isCurrentMonth: true,
        isToday,
        attended: attendedDates.has(key) && !isFuture,
        isFuture,
      })
    }

    while (cells.length % 7 !== 0) {
      cells.push({ day: 0, isCurrentMonth: false, isToday: false, attended: false, isFuture: false })
    }

    return cells
  }

  const calendarCells = buildCalendar()
  const weeks: typeof calendarCells[] = []
  for (let i = 0; i < calendarCells.length; i += 7) {
    weeks.push(calendarCells.slice(i, i + 7))
  }

  function getTotalAllTime(): number {
    return summary.totalDays || attendance.length
  }

  if (loading) return <SkeletonAttendance />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
        <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
          <X className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load attendance</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <button
          onClick={fetchAttendance}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Try Again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Attendance History</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track your gym visits and stay consistent</p>
        </div>
        <div className="rounded-xl bg-indigo-500/10 p-3 dark:bg-indigo-400/10">
          <CalendarCheck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200/50 bg-white p-5 shadow-sm dark:border-gray-700/50 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-indigo-500/10 p-2 dark:bg-indigo-400/10">
              <CalendarCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">This Month</p>
              <p className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-gray-100">{summary.thisMonth} <span className="text-sm font-normal text-gray-400">days</span></p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200/50 bg-white p-5 shadow-sm dark:border-gray-700/50 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 dark:bg-emerald-400/10">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</p>
              <p className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-gray-100">{getTotalAllTime()} <span className="text-sm font-normal text-gray-400">days</span></p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200/50 bg-white p-5 shadow-sm dark:border-gray-700/50 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-500/10 p-2 dark:bg-amber-400/10">
              <Flame className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Streak</p>
              <p className="mt-0.5 text-2xl font-bold text-gray-900 dark:text-gray-100">{streak} <span className="text-sm font-normal text-gray-400">days</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateMonth(-1)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              {MONTH_LABELS[viewMonth - 1]} {viewYear}
            </h3>
            <button
              onClick={() => navigateMonth(1)}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day Labels */}
          <div className="grid grid-cols-7 gap-px mb-1">
            {DAY_LABELS.map((label) => (
              <div
                key={label}
                className="py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                {label}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-px">
            {weeks.map((week, weekIdx) =>
              week.map((cell, cellIdx) => {
                if (!cell.isCurrentMonth) {
                  return (
                    <div
                      key={`${weekIdx}-${cellIdx}`}
                      className="min-h-[48px] sm:min-h-[56px] p-1"
                    />
                  )
                }

                return (
                  <div
                    key={`${weekIdx}-${cellIdx}`}
                    className={`relative min-h-[48px] sm:min-h-[56px] rounded-lg p-1.5 flex flex-col items-center justify-center transition-colors ${
                      cell.isToday
                        ? "ring-2 ring-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                  >
                    <span className={`text-sm font-medium ${
                      cell.isToday
                        ? "text-indigo-700 dark:text-indigo-300"
                        : cell.isFuture
                          ? "text-gray-300 dark:text-gray-600"
                          : "text-gray-700 dark:text-gray-300"
                    }`}>
                      {cell.day}
                    </span>
                    {cell.isFuture ? null : cell.attended ? (
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                    ) : cell.isCurrentMonth ? (
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-gray-300 dark:bg-gray-600" />
                    ) : null}
                  </div>
                )
              })
            )}
          </div>

          {/* Legend */}
          <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span>Absent</span>
            </div>
            {now.getMonth() + 1 === viewMonth && now.getFullYear() === viewYear && (
              <span className="text-indigo-500 font-medium">Today highlighted</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Attendance in {MONTH_LABELS[viewMonth - 1]} {viewYear}
            </h3>
          </div>
        </CardHeader>
        <CardContent>
          {attendance.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <CalendarCheck className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No attendance records for this month</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {viewMonth === now.getMonth() + 1 && viewYear === now.getFullYear()
                  ? "Start your fitness journey by checking in at the gym!"
                  : "No visits recorded for this period."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {attendance.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-emerald-500/10 p-2 dark:bg-emerald-400/10">
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {formatDate(new Date(record.date))}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {getDayName(record.date)} &middot; Check-in: {getTime(record.checkIn)}
                        {record.checkOut && <> &middot; Check-out: {getTime(record.checkOut)}</>}
                      </p>
                    </div>
                  </div>
                  <Badge status="PAID">Present</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
