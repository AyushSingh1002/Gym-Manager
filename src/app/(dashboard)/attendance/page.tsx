"use client"

import { useState, useEffect, useCallback } from "react"
import { CalendarCheck, Search, UserCheck, Clock, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { formatDateTime, getPlanLabel } from "@/lib/utils"

interface AttendanceMember {
  id: string
  name: string
  phone: string
  email: string | null
  status: string
}

interface AttendanceRecord {
  id: string
  memberId: string
  date: string
  member: AttendanceMember
}

interface AttendanceResponse {
  attendance: AttendanceRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
  summary: {
    totalCheckedIn: number
    planBreakdown: Record<string, number>
  }
}

interface SearchMember {
  id: string
  name: string
  phone: string
  email: string | null
  status: string
  memberships: Array<{ plan: string }>
}

const planCardColors: Record<string, string> = {
  MONTHLY: "bg-surface-2 text-ink",
  QUARTERLY: "bg-surface-2 text-ink",
  HALF_YEARLY: "bg-surface-2 text-ink",
  YEARLY: "bg-surface-2 text-ink",
  CUSTOM: "bg-surface-2 text-ink",
}

function getPlanCardColor(plan: string): string {
  return planCardColors[plan] || "bg-surface-2 text-ink-muted"
}

export default function AttendancePage() {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [summary, setSummary] = useState<{ totalCheckedIn: number; planBreakdown: Record<string, number> } | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])

  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchMember[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedMember, setSelectedMember] = useState<SearchMember | null>(null)
  const [checkingIn, setCheckingIn] = useState(false)
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const fetchAttendance = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (selectedDate) params.set("date", selectedDate)
      params.set("page", String(page))
      params.set("limit", "10")

      const res = await fetch(`/api/attendance?${params}`)
      if (!res.ok) throw new Error(res.status === 401 ? "Unauthorized" : "Failed to fetch attendance")
      const data: AttendanceResponse = await res.json()
      setAttendance(data.attendance)
      setTotalPages(data.totalPages)
      setTotal(data.total)
      setSummary(data.summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [selectedDate, page])

  useEffect(() => {
    fetchAttendance()
  }, [fetchAttendance])

  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query)
    setSelectedMember(null)
    setFeedback(null)
    if (!query.trim()) {
      setSearchResults([])
      return
    }
    try {
      setSearching(true)
      const res = await fetch(`/api/members?search=${encodeURIComponent(query)}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.members)
      }
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }, [])

  const handleCheckIn = async () => {
    if (!selectedMember) return
    try {
      setCheckingIn(true)
      setFeedback(null)
      const res = await fetch(`/api/members/${selectedMember.id}/attendance`, {
        method: "POST",
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to check in")
      }
      setFeedback({ type: "success", message: `${selectedMember.name} checked in successfully!` })
      setSelectedMember(null)
      setSearchQuery("")
      setSearchResults([])
      fetchAttendance()
    } catch (err) {
      setFeedback({ type: "error", message: err instanceof Error ? err.message : "Something went wrong" })
    } finally {
      setCheckingIn(false)
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value)
    setPage(1)
  }

  const todayStr = new Date().toISOString().split("T")[0]
  const isToday = selectedDate === todayStr

  if (error && !loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Attendance</h1>
          <p className="text-sm text-ink-muted mt-1">Track and manage daily member attendance</p>
        </div>
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-semantic-error/10">
                <CalendarCheck className="h-8 w-8 text-semantic-error" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-ink">Failed to load attendance</h2>
              <p className="mt-2 text-sm text-ink-muted">{error}</p>
              <Button onClick={fetchAttendance} className="mt-4">
                Try again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Attendance</h1>
        <p className="text-sm text-ink-muted mt-1">Track and manage daily member attendance</p>
      </div>

      {isToday && (
        <div className="flex items-center gap-2 text-sm text-ink-muted">
          <CalendarCheck className="h-4 w-4" />
          <span>
            {new Date().toLocaleDateString("en-IN", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
      )}

      {!loading && !error && summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2">
                  <UserCheck className="h-5 w-5 text-ink" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-ink">{summary.totalCheckedIn}</p>
                  <p className="text-xs text-ink-muted">Checked In Today</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {Object.entries(summary.planBreakdown).map(([plan, count]) => (
            <Card key={plan}>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${getPlanCardColor(plan)}`}>
                    <CalendarCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-ink">{count}</p>
                    <p className="text-xs text-ink-muted">{getPlanLabel(plan)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader title="Quick Check-In" description="Search for a member to mark their attendance" />
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Input
                placeholder="Search by name or phone..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                icon={<Search className="h-4 w-4" />}
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              )}
            </div>

            {searchResults.length > 0 && !selectedMember && (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-hairline divide-y divide-hairline">
                {searchResults.map((member) => (
                  <button
                    key={member.id}
                    type="button"
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-surface-2 text-ink transition-colors"
                    onClick={() => {
                      setSelectedMember(member)
                      setSearchQuery(member.name)
                      setSearchResults([])
                    }}
                  >
                    <span className="font-medium">{member.name}</span>
                    <span className="text-ink-muted ml-2">{member.phone}</span>
                    {member.memberships?.[0] && (
                      <span className="text-ink-tertiary ml-2 text-xs">
                        {getPlanLabel(member.memberships[0].plan)}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {searchQuery && !searching && searchResults.length === 0 && !selectedMember && (
              <p className="text-sm text-ink-muted">No members found</p>
            )}

            {selectedMember && (
              <div className="rounded-lg border border-hairline p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-ink">{selectedMember.name}</p>
                    <p className="text-sm text-ink-muted">{selectedMember.phone}</p>
                    {selectedMember.memberships?.[0] && (
                      <p className="text-sm text-ink-muted">
                        Plan: {getPlanLabel(selectedMember.memberships[0].plan)}
                      </p>
                    )}
                  </div>
                  <Button onClick={handleCheckIn} loading={checkingIn}>
                    <UserCheck className="h-4 w-4" />
                    Check In
                  </Button>
                </div>
              </div>
            )}

            {feedback && (
              <div
                className={`flex items-center gap-2 rounded-lg p-3 text-sm ${
                  feedback.type === "success"
                    ? "bg-semantic-success/15 text-semantic-success"
                    : "bg-semantic-error/10 border border-semantic-error/20 text-semantic-error"
                }`}
              >
                {feedback.type === "success" ? (
                  <UserCheck className="h-4 w-4 shrink-0" />
                ) : (
                  <CalendarCheck className="h-4 w-4 shrink-0" />
                )}
                {feedback.message}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title="Attendance Records"
          description={
            isToday
              ? "Today's attendance"
              : `Attendance for ${new Date(selectedDate + "T00:00:00").toLocaleDateString("en-IN", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}`
          }
          action={
            <Input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="w-44"
              icon={<CalendarDays className="h-4 w-4" />}
            />
          }
        />
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : attendance.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-2">
                <Clock className="h-8 w-8 text-ink-tertiary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">No attendance records</h3>
              <p className="mt-2 text-sm text-ink-muted max-w-sm">
                {isToday
                  ? "No one has checked in yet today. Use the quick check-in above to mark attendance."
                  : "No attendance records found for the selected date."}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hairline">
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Member Name</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Phone</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Plan</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Check-in Time</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {attendance.map((record) => (
                      <tr
                        key={record.id}
                        className="border-b border-hairline/50 hover:bg-surface-2/50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-ink">
                              {record.member.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-ink">
                              {record.member.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-ink-muted">{record.member.phone}</td>
                        <td className="px-4 py-3 text-sm text-ink-muted">&mdash;</td>
                        <td className="px-4 py-3 text-sm text-ink-muted">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {formatDateTime(record.date)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge status={record.member.status}>{record.member.status}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-muted">
                    Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total} records
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Button
                        key={p}
                        variant={p === page ? "primary" : "outline"}
                        size="sm"
                        onClick={() => setPage(p)}
                        className="min-w-[36px]"
                      >
                        {p}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
