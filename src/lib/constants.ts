export const APP_NAME = "GymFlow"

export const JWT = {
  ADMIN_SECRET: process.env.JWT_SECRET || "",
  MEMBER_SECRET: process.env.JWT_SECRET || "",
  ADMIN_EXPIRY: "7d",
  MEMBER_EXPIRY: "30d",
  ADMIN_COOKIE: "session",
  MEMBER_COOKIE: "member_session",
}

export const COOKIE_CONFIG = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
}

export const ADMIN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7
export const MEMBER_COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export const PLANS = {
  MONTHLY: { amount: 999, months: 1, label: "Monthly" },
  QUARTERLY: { amount: 2499, months: 3, label: "Quarterly" },
  HALF_YEARLY: { amount: 4499, months: 6, label: "Half Yearly" },
  YEARLY: { amount: 7999, months: 12, label: "Yearly" },
  CUSTOM: { amount: 0, months: 0, label: "Custom" },
} as const

export type PlanKey = keyof typeof PLANS

export const PLAN_AMOUNTS: Record<string, number> = {
  MONTHLY: 999,
  QUARTERLY: 2499,
  HALF_YEARLY: 4499,
  YEARLY: 7999,
  CUSTOM: 0,
}

export const PLAN_LABELS: Record<string, string> = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  HALF_YEARLY: "Half Yearly",
  YEARLY: "Yearly",
  CUSTOM: "Custom",
}

export const PLAN_MONTHS: Record<string, number> = {
  MONTHLY: 1,
  QUARTERLY: 3,
  HALF_YEARLY: 6,
  YEARLY: 12,
  CUSTOM: 0,
}

export const MEMBER_ID_PREFIX = "GF"
export const MEMBER_ID_PAD_LENGTH = 6

export const RECEIPT_PREFIX = "GF"

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
}

export const CURRENCY = "INR"
export const TIMEZONE = "Asia/Kolkata"
export const LOCALE = "en-IN"

export const PASSWORD_MIN_LENGTH = 6
export const PHONE_MIN_LENGTH = 10

export const GYM_DEFAULTS = {
  name: "GymFlow Fitness",
  timezone: "Asia/Kolkata",
  currency: "INR",
}

export const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-semantic-success/15 text-semantic-success",
  EXPIRED: "bg-semantic-error/15 text-semantic-error",
  CANCELLED: "bg-surface-2 text-ink-tertiary",
  PENDING: "bg-amber-500/15 text-amber-400",
  PAID: "bg-semantic-success/15 text-semantic-success",
  FAILED: "bg-semantic-error/15 text-semantic-error",
  REFUNDED: "bg-primary/15 text-primary",
}

export const DEFAULT_APP_URL = "http://localhost:3000"

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL
}
