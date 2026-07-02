import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, logActivity } from "@/lib/auth"
import { PAGINATION } from "@/lib/constants"
import { rateLimitMiddleware } from "@/lib/rate-limit"

export async function GET(request: NextRequest) {
  try {
    const { allowed, headers } = rateLimitMiddleware(request)
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers })
    }

    const admin = await requireAuth()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const status = searchParams.get("status") || ""
    const plan = searchParams.get("plan") || ""
    const page = parseInt(searchParams.get("page") || String(PAGINATION.DEFAULT_PAGE))
    const limit = Math.min(parseInt(searchParams.get("limit") || String(PAGINATION.DEFAULT_LIMIT)), PAGINATION.MAX_LIMIT)
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    if (status) {
      where.status = status
    }

    if (plan) {
      where.memberships = {
        some: {
          plan,
          status: "ACTIVE",
        },
      }
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          memberships: {
            where: { status: "ACTIVE" },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
      }),
      prisma.member.count({ where }),
    ])

    return NextResponse.json({
      members,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error fetching members:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { allowed, headers } = rateLimitMiddleware(request, 20, 60000)
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers })
    }

    const admin = await requireAuth(["ADMIN"])

    const body = await request.json()
    const { firstName, lastName, email, phone, dateOfBirth, gender, address, alternatePhone, city, state, pincode, emergencyName, emergencyPhone, emergencyRelation, notes } = body

    if (!firstName || !phone) {
      return NextResponse.json(
        { error: "First name and phone are required" },
        { status: 400 }
      )
    }

    const existingMember = await prisma.member.findFirst({ where: { phone } })
    if (existingMember) {
      return NextResponse.json(
        { error: "A member with this phone number already exists" },
        { status: 409 }
      )
    }

    const member = await prisma.$transaction(async (tx) => {
      const lastMember = await tx.member.findFirst({
        orderBy: { createdAt: "desc" },
        select: { memberId: true },
      })
      const lastNum = lastMember ? parseInt(lastMember.memberId.replace("GF-", ""), 10) : 0
      const memberId = `GF-${String(lastNum + 1).padStart(6, "0")}`

      return tx.member.create({
        data: {
          memberId,
          firstName,
          lastName: lastName || "",
          email: email || null,
          phone,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
          gender: gender || null,
          address: address || null,
          alternatePhone: alternatePhone || null,
          city: city || null,
          state: state || null,
          pincode: pincode || null,
          emergencyName: emergencyName || null,
          emergencyPhone: emergencyPhone || null,
          emergencyRelation: emergencyRelation || null,
          notes: notes || null,
        },
      })
    })

    logActivity(admin.id, "Created member", "Member", member.id, `Created member ${member.firstName} ${member.lastName}`).catch(err => console.error("Failed to log activity:", err))

    return NextResponse.json({ member }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if ((error as Error).message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("Error creating member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
