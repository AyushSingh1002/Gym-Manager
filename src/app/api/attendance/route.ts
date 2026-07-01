import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { getDisplayName } from "@/lib/utils"
import { PAGINATION } from "@/lib/constants"

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAuth()

    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get("date")
    const page = parseInt(searchParams.get("page") || String(PAGINATION.DEFAULT_PAGE))
    const limit = Math.min(parseInt(searchParams.get("limit") || String(PAGINATION.DEFAULT_LIMIT)), PAGINATION.MAX_LIMIT)
    const skip = (page - 1) * limit

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    let dateFilter: { gte: Date; lt: Date }
    if (dateParam) {
      const filterDate = new Date(dateParam)
      filterDate.setHours(0, 0, 0, 0)
      const nextDay = new Date(filterDate)
      nextDay.setDate(nextDay.getDate() + 1)
      dateFilter = { gte: filterDate, lt: nextDay }
    } else {
      dateFilter = { gte: today, lt: tomorrow }
    }

    const where = { date: dateFilter }
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const todayEnd = new Date(todayStart)
    todayEnd.setDate(todayEnd.getDate() + 1)

    const [attendance, total, todayAttendance] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
              status: true,
            },
          },
        },
      }),
      prisma.attendance.count({ where }),
      prisma.attendance.findMany({
        where: {
          date: { gte: todayStart, lt: todayEnd },
        },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              memberships: {
                where: { status: "ACTIVE" },
                select: { plan: true },
                take: 1,
              },
            },
          },
        },
      }),
    ])

    const totalCheckedIn = todayAttendance.length

    const planBreakdown: Record<string, number> = {}
    for (const record of todayAttendance) {
      const plan = record.member.memberships[0]?.plan || "NONE"
      planBreakdown[plan] = (planBreakdown[plan] || 0) + 1
    }

    const attendanceWithNames = attendance.map((record) => ({
      ...record,
      member: {
        ...record.member,
        name: getDisplayName(record.member.firstName, record.member.lastName),
      },
    }))

    return NextResponse.json({
      attendance: attendanceWithNames,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalCheckedIn,
        planBreakdown,
      },
    })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error fetching attendance:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
