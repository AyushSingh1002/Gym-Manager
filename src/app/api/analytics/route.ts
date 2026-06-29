import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const admin = await requireAuth()

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const monthlyRevenueData = await getMonthlyRevenue()
    const memberGrowthData = await getMemberGrowth()
    const attendanceTrendData = await getAttendanceTrend()
    const planDistributionData = await getPlanDistribution()
    const activeInactiveData = await getActiveInactiveRatio()

    return NextResponse.json({
      monthlyRevenue: monthlyRevenueData,
      memberGrowth: memberGrowthData,
      attendanceTrend: attendanceTrendData,
      planDistribution: planDistributionData,
      activeInactive: activeInactiveData,
    })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function getMonthlyRevenue() {
  const months: { month: string; revenue: number }[] = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1)
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)

    const result = await prisma.payment.aggregate({
      where: {
        status: "PAID",
        createdAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { amount: true },
    })

    const monthName = d.toLocaleString("en-US", { month: "short", year: "2-digit" })
    months.push({ month: monthName, revenue: result._sum.amount || 0 })
  }

  return months
}

async function getMemberGrowth() {
  const growth: { month: string; new: number; total: number }[] = []
  const now = new Date()

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1)
    const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)

    const newMembers = await prisma.member.count({
      where: { createdAt: { gte: startOfMonth, lte: endOfMonth } },
    })

    const totalMembers = await prisma.member.count({
      where: { createdAt: { lte: endOfMonth } },
    })

    const monthName = d.toLocaleString("en-US", { month: "short", year: "2-digit" })
    growth.push({ month: monthName, new: newMembers, total: totalMembers })
  }

  return growth
}

async function getAttendanceTrend() {
  const trend: { date: string; count: number }[] = []
  const now = new Date()

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const nextDay = new Date(d)
    nextDay.setDate(nextDay.getDate() + 1)

    const count = await prisma.attendance.count({
      where: { date: { gte: d, lt: nextDay } },
    })

    const dateStr = d.toISOString().split("T")[0]
    trend.push({ date: dateStr, count })
  }

  return trend
}

async function getPlanDistribution() {
  const plans = ["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"]
  const distribution: { name: string; count: number; percentage: number }[] = []

  const totalActiveMemberships = await prisma.membership.count({
    where: { status: "ACTIVE" },
  })

  for (const plan of plans) {
    const count = await prisma.membership.count({
      where: { plan: plan as any, status: "ACTIVE" },
    })

    distribution.push({
      name: plan,
      count,
      percentage: totalActiveMemberships > 0 ? Math.round((count / totalActiveMemberships) * 100) : 0,
    })
  }

  return distribution
}

async function getActiveInactiveRatio() {
  const active = await prisma.member.count({ where: { status: "ACTIVE" } })
  const inactive = await prisma.member.count({ where: { status: { in: ["EXPIRED", "CANCELLED", "PENDING"] } } })

  return { active, inactive, ratio: active > 0 ? (active / (active + inactive)) * 100 : 0 }
}
