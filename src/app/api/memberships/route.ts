import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { getDisplayName } from "@/lib/utils"
import { PAGINATION } from "@/lib/constants"

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAuth()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const plan = searchParams.get("plan") || ""
    const status = searchParams.get("status") || ""
    const page = parseInt(searchParams.get("page") || String(PAGINATION.DEFAULT_PAGE))
    const limit = Math.min(parseInt(searchParams.get("limit") || String(PAGINATION.DEFAULT_LIMIT)), PAGINATION.MAX_LIMIT)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (plan) {
      where.plan = plan
    }

    if (status) {
      where.status = status
    }

    if (search) {
      where.member = {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { phone: { contains: search } },
        ],
      }
    }

    const [memberships, total] = await Promise.all([
      prisma.membership.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
        },
      }),
      prisma.membership.count({ where }),
    ])

    const membershipsWithNames = memberships.map((membership) => ({
      ...membership,
      member: {
        ...membership.member,
        name: getDisplayName(membership.member.firstName, membership.member.lastName),
      },
    }))

    return NextResponse.json({
      memberships: membershipsWithNames,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error fetching memberships:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
