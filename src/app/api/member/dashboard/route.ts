import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMemberAuth } from "@/lib/member-auth"
import { getDaysRemaining } from "@/lib/utils"

export async function GET() {
  try {
    const member = await requireMemberAuth()

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    const [
      todayAttendance,
      monthAttendanceCount,
      activeMembership,
      recentPayments,
      unreadCount,
    ] = await Promise.all([
      prisma.attendance.findFirst({
        where: {
          memberId: member.id,
          date: { gte: todayStart, lt: todayEnd },
        },
      }),
      prisma.attendance.count({
        where: {
          memberId: member.id,
          date: { gte: monthStart, lt: monthEnd },
        },
      }),
      prisma.membership.findFirst({
        where: { memberId: member.id, status: "ACTIVE" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          plan: true,
          startDate: true,
          endDate: true,
          status: true,
        },
      }),
      prisma.payment.findMany({
        where: { memberId: member.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          receiptNo: true,
          amount: true,
          method: true,
          status: true,
          date: true,
        },
      }),
      prisma.notification.count({
        where: { memberId: member.id, read: false },
      }),
    ])

    return NextResponse.json({
      member: {
        firstName: member.firstName,
        lastName: member.lastName,
        status: member.status,
      },
      currentMembership: activeMembership
        ? {
            plan: activeMembership.plan,
            startDate: activeMembership.startDate,
            endDate: activeMembership.endDate,
            daysRemaining: getDaysRemaining(activeMembership.endDate),
          }
        : null,
      todayAttendance: !!todayAttendance,
      monthAttendanceCount,
      recentPayments,
      unreadNotifications: unreadCount,
    })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Member dashboard error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
