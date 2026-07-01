import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const admin = await requireAuth(["ADMIN"])

    const [monthlyRevenueData, memberGrowthData, attendanceTrendData, planDistributionData, activeInactiveData] =
      await Promise.all([
        getMonthlyRevenue(),
        getMemberGrowth(),
        getAttendanceTrend(),
        getPlanDistribution(),
        getActiveInactiveRatio(),
      ])

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
    if ((error as Error).message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("Error fetching analytics:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function getMonthlyRevenue() {
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const results = await prisma.payment.groupBy({
    by: ["createdAt"],
    where: {
      status: "PAID",
      createdAt: { gte: sixMonthsAgo },
    },
    _sum: { amount: true },
  })

  const months: { month: string; revenue: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthName = d.toLocaleString("en-US", { month: "short", year: "2-digit" })
    const monthStart = d.getTime()
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime()

    const revenue = results
      .filter((r) => {
        const t = new Date(r.createdAt).getTime()
        return t >= monthStart && t <= monthEnd
      })
      .reduce((sum, r) => sum + (r._sum.amount || 0), 0)

    months.push({ month: monthName, revenue })
  }

  return months
}

async function getMemberGrowth() {
  const now = new Date()
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)

  const members = await prisma.member.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  })

  const totalUpToSixMonthsAgo = await prisma.member.count({
    where: { createdAt: { lt: sixMonthsAgo } },
  })

  const growth: { month: string; new: number; total: number }[] = []
  let runningTotal = totalUpToSixMonthsAgo

  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
    const monthStart = d.getTime()
    const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999).getTime()
    const monthName = d.toLocaleString("en-US", { month: "short", year: "2-digit" })

    const newCount = members.filter((m) => {
      const t = new Date(m.createdAt).getTime()
      return t >= monthStart && t <= monthEnd
    }).length

    runningTotal += newCount
    growth.push({ month: monthName, new: newCount, total: runningTotal })
  }

  return growth
}

async function getAttendanceTrend() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29)
  thirtyDaysAgo.setHours(0, 0, 0, 0)

  const records = await prisma.attendance.groupBy({
    by: ["date"],
    where: {
      date: { gte: thirtyDaysAgo },
    },
    _count: { id: true },
  })

  const dateMap = new Map<string, number>()
  for (const r of records) {
    const key = new Date(r.date).toISOString().split("T")[0]
    dateMap.set(key, r._count.id)
  }

  const trend: { date: string; count: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split("T")[0]
    trend.push({ date: key, count: dateMap.get(key) || 0 })
  }

  return trend
}

async function getPlanDistribution() {
  const activeMemberships = await prisma.membership.findMany({
    where: { status: "ACTIVE" },
    select: { plan: true },
  })

  const total = activeMemberships.length
  const counts: Record<string, number> = {}

  for (const m of activeMemberships) {
    counts[m.plan] = (counts[m.plan] || 0) + 1
  }

  const plans = ["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY"]
  return plans.map((name) => ({
    name,
    count: counts[name] || 0,
    percentage: total > 0 ? Math.round(((counts[name] || 0) / total) * 100) : 0,
  }))
}

async function getActiveInactiveRatio() {
  const [active, inactive] = await Promise.all([
    prisma.member.count({ where: { status: "ACTIVE" } }),
    prisma.member.count({ where: { status: { in: ["EXPIRED", "CANCELLED", "PENDING"] } } }),
  ])

  return { active, inactive, ratio: active > 0 ? (active / (active + inactive)) * 100 : 0 }
}
