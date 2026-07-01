"use client"
import { useState, useEffect } from "react"
import { Bell, Clock, IndianRupee, Dumbbell, Megaphone, AlertTriangle, CheckCheck, ChevronRight, Calendar, AlertCircle } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/utils"

interface Notification {
  id: string
  title: string
  message: string
  type: "EXPIRY" | "PAYMENT" | "WORKOUT" | "ANNOUNCEMENT" | "REMINDER"
  read: boolean
  link: string | null
  createdAt: string
}

interface NotificationsData {
  notifications: Notification[]
  total: number
  unreadCount: number
  page: number
  limit: number
  totalPages: number
}

const NOTIFICATION_ICONS: Record<string, React.ElementType> = {
  EXPIRY: AlertTriangle,
  PAYMENT: IndianRupee,
  WORKOUT: Dumbbell,
  ANNOUNCEMENT: Megaphone,
  REMINDER: Bell,
}

const ICON_COLORS: Record<string, string> = {
  EXPIRY: "bg-surface-2 text-ink",
  PAYMENT: "bg-surface-2 text-ink",
  WORKOUT: "bg-surface-2 text-ink",
  ANNOUNCEMENT: "bg-surface-2 text-ink",
  REMINDER: "bg-surface-2 text-ink",
}

function getTimeAgo(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHrs / 24)

  if (diffMins < 1) return "Just now"
  if (diffMins < 60) return `${diffMins} min ago`
  if (diffHrs < 24) return `${diffHrs} hour${diffHrs === 1 ? "" : "s"} ago`

  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`

  return formatDateTime(date)
}

function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-4 p-4 animate-pulse">
      <div className="h-10 w-10 rounded-xl bg-surface-2 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-32 bg-surface-2 rounded" />
          <div className="h-2 w-2 rounded-full bg-surface-2" />
        </div>
        <div className="h-3 w-64 bg-surface-2 rounded" />
        <div className="h-2 w-20 bg-surface-2 rounded" />
      </div>
    </div>
  )
}

export default function MemberNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [markingAll, setMarkingAll] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  async function fetchNotifications() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/member/notifications?page=1&limit=50")
      if (!res.ok) throw new Error("Failed to load notifications")
      const data: NotificationsData = await res.json()
      setNotifications(data.notifications)
      setUnreadCount(data.unreadCount)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkAllRead() {
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id)
    if (unreadIds.length === 0) return

    setMarkingAll(true)
    try {
      const res = await fetch("/api/member/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: unreadIds }),
      })
      if (!res.ok) throw new Error("Failed to mark as read")
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // silent
    } finally {
      setMarkingAll(false)
    }
  }

  async function handleMarkRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))

    try {
      await fetch("/api/member/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: [id] }),
      })
    } catch {
      fetchNotifications()
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="flex items-center justify-between">
          <div className="animate-pulse space-y-2">
            <div className="h-8 w-36 bg-surface-2 rounded" />
            <div className="h-4 w-48 bg-surface-2 rounded" />
          </div>
          <div className="h-9 w-36 bg-surface-2 rounded-lg animate-pulse" />
        </div>
        <div className="rounded-xl border border-hairline bg-surface-1 divide-y divide-hairline">
          {Array.from({ length: 5 }).map((_, i) => <NotificationSkeleton key={i} />)}
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
        <h3 className="mt-4 text-lg font-semibold text-ink">Failed to load notifications</h3>
        <p className="mt-1 text-sm text-ink-muted">{error}</p>
        <Button onClick={fetchNotifications} className="mt-4">Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Notifications</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Stay updated with your gym activity
          </p>
        </div>
        <div className="flex items-center gap-3">
          {unreadCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-medium text-primary">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              {unreadCount} unread
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            loading={markingAll}
            disabled={unreadCount === 0}
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark All as Read
          </Button>
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-hairline bg-surface-1 py-20">
          <div className="rounded-full bg-surface-2 p-6">
            <Bell className="h-12 w-12 text-ink-tertiary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-ink">No notifications yet</h3>
          <p className="mt-1 text-sm text-ink-muted text-center max-w-sm">
            We'll notify you about membership updates, workout reminders, and gym announcements here.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-hairline bg-surface-1 divide-y divide-hairline overflow-hidden">
          {notifications.map((notification) => {
            const Icon = NOTIFICATION_ICONS[notification.type] || Bell
            const colorClass = ICON_COLORS[notification.type] || ICON_COLORS.REMINDER
            return (
              <button
                key={notification.id}
                onClick={() => !notification.read && handleMarkRead(notification.id)}
                className={`w-full flex items-start gap-4 p-4 sm:p-5 text-left transition-all duration-200 hover:bg-surface-2 ${
                  !notification.read ? "bg-surface-2" : ""
                }`}
              >
                <div className={`shrink-0 rounded-xl p-2.5 ${colorClass}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <p
                        className={`text-sm truncate ${
                          !notification.read
                            ? "font-semibold text-ink"
                            : "font-medium text-ink-muted"
                        }`}
                      >
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0 mt-0.5" />
                      )}
                    </div>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-muted line-clamp-2">
                    {notification.message}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <Clock className="h-3 w-3 text-ink-tertiary" />
                    <span className="text-xs text-ink-tertiary">
                      {getTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                </div>
                {notification.link && (
                  <ChevronRight className="h-4 w-4 text-ink-tertiary shrink-0 mt-1" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
