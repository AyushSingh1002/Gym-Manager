export interface DashboardMetric {
  label: string
  value: string | number
  change?: string
  changeType?: "positive" | "negative" | "neutral"
  icon: string
}

export interface MonthlyRevenue {
  month: string
  revenue: number
}

export interface MemberGrowth {
  month: string
  new: number
  total: number
}

export interface AttendanceSummary {
  date: string
  count: number
}

export interface PlanDistribution {
  name: string
  count: number
  percentage: number
}
