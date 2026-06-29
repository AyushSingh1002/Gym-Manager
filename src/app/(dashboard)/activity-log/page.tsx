"use client"

import { useState, useEffect, useCallback } from "react"
import { History, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, UserPlus, CalendarCheck, Clock } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { TableSkeleton } from "@/components/ui/skeleton"
import { formatDateTime } from "@/lib/utils"

interface ActivityAdmin {
  id: string
  name: string
  email: string
}

interface ActivityEntry {
  id: string
  action: string
  entity: string
  description: string
  createdAt: string
  admin: ActivityAdmin
}

interface ActivityResponse {
  activities: ActivityEntry[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const actionOptions = [
  { value: "", label: "All Actions" },
  { value: "CREATED", label: "Created" },
  { value: "UPDATED", label: "Updated" },
  { value: "DELETED", label: "Deleted" },
  { value: "MARKED", label: "Marked" },
  { value: "RECORDED", label: "Recorded" },
  { value: "ASSIGNED", label: "Assigned" },
]

const entityOptions = [
  { value: "", label: "All Entities" },
  { value: "MEMBER", label: "Member" },
  { value: "MEMBERSHIP", label: "Membership" },
  { value: "ATTENDANCE", label: "Attendance" },
  { value: "PAYMENT", label: "Payment" },
]

const actionIcons: Record<string, React.ElementType> = {
  CREATED: Plus,
  UPDATED: Pencil,
  DELETED: Trash2,
  MARKED: CalendarCheck,
  RECORDED: Clock,
  ASSIGNED: UserPlus,
}

const actionColors: Record<string, string> = {
  CREATED: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950",
  UPDATED: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950",
  DELETED: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950",
  MARKED: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950",
  RECORDED: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950",
  ASSIGNED: "text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950",
}

const entityBadgeColors: Record<string, string> = {
  MEMBER: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  MEMBERSHIP: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  ATTENDANCE: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  PAYMENT: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
}

function getActionIcon(action: string): React.ElementType {
  return actionIcons[action] || History
}

function getActionColor(action: string): string {
  return actionColors[action] || "text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-800"
}

function getEntityBadgeColor(entity: string): string {
  return entityBadgeColors[entity] || "bg-gray-500/10 text-gray-600 dark:text-gray-400"
}

function getRelativeTime(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDateTime(dateStr)
}

export default function ActivityLogPage() {
  const [activities, setActivities] = useState<ActivityEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionFilter, setActionFilter] = useState("")
  const [entityFilter, setEntityFilter] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (actionFilter) params.set("action", actionFilter)
      if (entityFilter) params.set("entity", entityFilter)
      if (fromDate) params.set("from", fromDate)
      if (toDate) params.set("to", toDate)
      params.set("page", String(page))
      params.set("limit", "20")

      const res = await fetch(`/api/activity-log?${params}`)
      if (!res.ok) throw new Error(res.status === 401 ? "Unauthorized" : "Failed to fetch activity log")
      const data: ActivityResponse = await res.json()
      setActivities(data.activities)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [actionFilter, entityFilter, fromDate, toDate, page])

  useEffect(() => {
    fetchActivities()
  }, [fetchActivities])

  const handleActionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActionFilter(e.target.value)
    setPage(1)
  }

  const handleEntityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setEntityFilter(e.target.value)
    setPage(1)
  }

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFromDate(e.target.value)
    setPage(1)
  }

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToDate(e.target.value)
    setPage(1)
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Activity Log</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track all actions performed in the system</p>
        </div>
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
                <History className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load activity log</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error}</p>
              <Button onClick={fetchActivities} className="mt-4">
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Activity Log</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track all actions performed in the system</p>
      </div>

      <Card>
        <CardHeader title="Filters" description="Narrow down activity records" />
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-44">
              <Select
                options={actionOptions}
                value={actionFilter}
                onChange={handleActionChange}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                options={entityOptions}
                value={entityFilter}
                onChange={handleEntityChange}
              />
            </div>
            <div className="w-full sm:w-44">
              <Input
                type="date"
                value={fromDate}
                onChange={handleFromDateChange}
                placeholder="From date"
              />
            </div>
            <div className="w-full sm:w-44">
              <Input
                type="date"
                value={toDate}
                onChange={handleToDateChange}
                placeholder="To date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={8} />
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800">
                <History className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">No activities found</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                {actionFilter || entityFilter || fromDate || toDate
                  ? "No activities match your filter criteria. Try adjusting your filters."
                  : "No activity has been recorded yet. Actions will appear here as they happen."}
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-0">
                {activities.map((activity, idx) => {
                  const ActionIcon = getActionIcon(activity.action)
                  return (
                    <div
                      key={activity.id}
                      className={`flex items-start gap-4 py-4 ${
                        idx < activities.length - 1 ? "border-b border-gray-100 dark:border-gray-800" : ""
                      }`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getActionColor(activity.action)}`}>
                        <ActionIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {activity.description}
                          </p>
                          <Badge status={activity.entity} className={getEntityBadgeColor(activity.entity)}>
                            {activity.entity}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            by {activity.admin.name}
                          </span>
                          <span className="text-xs text-gray-400 dark:text-gray-500">&middot;</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {getRelativeTime(activity.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Showing {(page - 1) * 20 + 1}-{Math.min(page * 20, total)} of {total} activities
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
