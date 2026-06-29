import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const admin = await requireAuth()

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const sevenDaysLater = new Date(today)
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7)

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999)

    const [
      totalActiveMembers,
      todayAttendanceCount,
      monthlyRevenue,
      expiringCount,
      pendingPaymentsCount,
      recentActivities,
    ] = await Promise.all([
      prisma.member.count({ where: { status: "ACTIVE" } }),
      prisma.attendance.count({
        where: { date: { gte: today, lt: tomorrow } },
      }),
      prisma.payment.aggregate({
        where: {
          status: "PAID",
          createdAt: { gte: startOfMonth, lte: endOfMonth },
        },
        _sum: { amount: true },
      }),
      prisma.membership.count({
        where: {
          status: "ACTIVE",
          endDate: { gte: today, lte: sevenDaysLater },
        },
      }),
      prisma.payment.count({ where: { status: "PENDING" } }),
      prisma.activityLog.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          admin: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
    ])

    return NextResponse.json({
      metrics: {
        totalActiveMembers: {
          label: "Total Active Members",
          value: totalActiveMembers,
          icon: "Users",
        },
        todayAttendance: {
          label: "Today's Attendance",
          value: todayAttendanceCount,
          icon: "CalendarCheck",
        },
        monthlyRevenue: {
          label: "Monthly Revenue",
          value: monthlyRevenue._sum.amount || 0,
          icon: "IndianRupee",
        },
        expiringMemberships: {
          label: "Expiring in 7 Days",
          value: expiringCount,
          icon: "AlertTriangle",
        },
        pendingPayments: {
          label: "Pending Payments",
          value: pendingPaymentsCount,
          icon: "Clock",
        },
      },
      recentActivities,
    })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error fetching dashboard:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
