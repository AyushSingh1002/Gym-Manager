import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getInitials(firstName: string, lastName?: string): string {
  return `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase()
}

export function getDisplayName(firstName?: string | null, lastName?: string | null, fallback = "Unknown Member") {
  const fullName = [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ")
  return fullName || fallback
}

export function calculateEndDate(startDate: Date, plan: string): Date {
  const end = new Date(startDate)
  switch (plan) {
    case "MONTHLY":
      end.setMonth(end.getMonth() + 1)
      break
    case "QUARTERLY":
      end.setMonth(end.getMonth() + 3)
      break
    case "HALF_YEARLY":
      end.setMonth(end.getMonth() + 6)
      break
    case "YEARLY":
      end.setFullYear(end.getFullYear() + 1)
      break
    default:
      end.setMonth(end.getMonth() + 1)
  }
  return end
}

export function getDaysRemaining(endDate: Date): number {
  const now = new Date()
  const diff = new Date(endDate).getTime() - now.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function getPlanAmount(plan: string): number {
  switch (plan) {
    case "MONTHLY": return 999
    case "QUARTERLY": return 2499
    case "HALF_YEARLY": return 4499
    case "YEARLY": return 7999
    default: return 0
  }
}

export function getPlanLabel(plan: string): string {
  const labels: Record<string, string> = {
    MONTHLY: "Monthly",
    QUARTERLY: "Quarterly",
    HALF_YEARLY: "Half Yearly",
    YEARLY: "Yearly",
    CUSTOM: "Custom",
  }
  return labels[plan] || plan
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    ACTIVE: "bg-semantic-success/15 text-semantic-success",
    EXPIRED: "bg-semantic-error/15 text-semantic-error",
    CANCELLED: "bg-surface-2 text-ink-tertiary",
    PENDING: "bg-amber-500/15 text-amber-400",
    PAID: "bg-semantic-success/15 text-semantic-success",
    FAILED: "bg-semantic-error/15 text-semantic-error",
    REFUNDED: "bg-primary/15 text-primary",
  }
  return colors[status] || "bg-surface-2 text-ink-tertiary"
}

export function generateReceiptNo(): string {
  const date = new Date()
  const y = date.getFullYear().toString().slice(-2)
  const m = (date.getMonth() + 1).toString().padStart(2, "0")
  const d = date.getDate().toString().padStart(2, "0")
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `GF-${y}${m}${d}-${rand}`
}
