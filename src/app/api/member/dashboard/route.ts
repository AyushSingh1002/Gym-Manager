import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMemberAuth } from "@/lib/member-auth"
import { getDaysRemaining } from "@/lib/utils"
import { rateLimitMiddleware } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  try {
    const { allowed, headers } = rateLimitMiddleware(request)
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers })
    }

    const member = await requireMemberAuth()

    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1)

    // Auto-expire memberships past their end date
    const expiredMemberships = await prisma.membership.findMany({
      where: {
        memberId: member.id,
        status: "ACTIVE",
        endDate: { lt: now },
      },
    })

    if (expiredMemberships.length > 0) {
      const expiredIds = expiredMemberships.map(m => m.id)
      await prisma.membership.updateMany({
        where: { id: { in: expiredIds } },
        data: { status: "EXPIRED" },
      })
    }

    // Update member status to EXPIRED if no active membership remains
    if (expiredMemberships.length > 0 && member.status === "ACTIVE") {
      const hasOtherActive = await prisma.membership.findFirst({
        where: {
          memberId: member.id,
          status: "ACTIVE",
          endDate: { gte: now },
        },
      })
      if (!hasOtherActive) {
        await prisma.member.update({
          where: { id: member.id },
          data: { status: "EXPIRED" },
        })
      }
    }

    const [
      todayAttendance,
      monthAttendanceCount,
      activeMembership,
      pendingMembership,
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
      prisma.membership.findFirst({
        where: { memberId: member.id, status: "PENDING" },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          plan: true,
          amount: true,
          status: true,
          createdAt: true,
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
        status: expiredMemberships.length > 0 ? "EXPIRED" : member.status,
      },
      currentMembership: activeMembership
        ? {
            plan: activeMembership.plan,
            startDate: activeMembership.startDate,
            endDate: activeMembership.endDate,
            daysRemaining: getDaysRemaining(activeMembership.endDate),
          }
        : null,
      pendingMembership: pendingMembership
        ? {
            id: pendingMembership.id,
            plan: pendingMembership.plan,
            amount: pendingMembership.amount,
            createdAt: pendingMembership.createdAt,
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
