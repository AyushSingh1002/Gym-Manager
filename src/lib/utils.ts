import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { LOCALE, CURRENCY, PLAN_AMOUNTS, PLAN_LABELS, PLAN_MONTHS, STATUS_COLORS, RECEIPT_PREFIX } from "./constants"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date))
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat(LOCALE, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(LOCALE, {
    style: "currency",
    currency: CURRENCY,
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
  const months = PLAN_MONTHS[plan]
  if (months) {
    end.setMonth(end.getMonth() + months)
  } else {
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
  return PLAN_AMOUNTS[plan] || 0
}

export function getPlanLabel(plan: string): string {
  return PLAN_LABELS[plan] || plan
}

export function getStatusColor(status: string): string {
  return STATUS_COLORS[status] || "bg-surface-2 text-ink-tertiary"
}

export function generateReceiptNo(): string {
  const date = new Date()
  const y = date.getFullYear().toString().slice(-2)
  const m = (date.getMonth() + 1).toString().padStart(2, "0")
  const d = date.getDate().toString().padStart(2, "0")
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase()
  return `${RECEIPT_PREFIX}-${y}${m}${d}-${rand}`
}
