import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMemberAuth } from "@/lib/member-auth"

export async function GET(request: NextRequest) {
  try {
    const member = await requireMemberAuth()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100)
    const skip = (page - 1) * limit
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    const now = new Date()
    const filterMonth = month ? parseInt(month) : now.getMonth() + 1
    const filterYear = year ? parseInt(year) : now.getFullYear()

    const monthStart = new Date(filterYear, filterMonth - 1, 1)
    const monthEnd = new Date(filterYear, filterMonth, 1)

    const where = {
      memberId: member.id,
      date: { gte: monthStart, lt: monthEnd },
    }

    const [attendance, total, thisMonthCount] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        select: {
          id: true,
          date: true,
          checkIn: true,
          checkOut: true,
        },
      }),
      prisma.attendance.count({ where }),
      prisma.attendance.count({
        where: {
          memberId: member.id,
          date: {
            gte: new Date(now.getFullYear(), now.getMonth(), 1),
            lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
          },
        },
      }),
    ])

    return NextResponse.json({
      attendance,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary: {
        totalDays: total,
        thisMonth: thisMonthCount,
      },
    })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Member attendance error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
