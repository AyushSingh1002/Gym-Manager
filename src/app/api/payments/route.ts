import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, logActivity } from "@/lib/auth"
import { generateReceiptNo, getDisplayName } from "@/lib/utils"

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAuth()

    const { searchParams } = new URL(request.url)
    const method = searchParams.get("method") || ""
    const status = searchParams.get("status") || ""
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const where: Record<string, unknown> = {}

    if (method) where.method = method
    if (status) where.status = status

    if (from || to) {
      const dateFilter: Record<string, Date> = {}
      if (from) dateFilter.gte = new Date(from)
      if (to) {
        const endDate = new Date(to)
        endDate.setHours(23, 59, 59, 999)
        dateFilter.lte = endDate
      }
      where.createdAt = dateFilter
    }

    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
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
          membership: {
            select: {
              id: true,
              plan: true,
              startDate: true,
              endDate: true,
            },
          },
        },
      }),
      prisma.payment.count({ where }),
    ])

    const paymentsWithNames = payments.map((payment) => ({
      ...payment,
      member: {
        ...payment.member,
        name: getDisplayName(payment.member.firstName, payment.member.lastName),
      },
    }))

    return NextResponse.json({
      payments: paymentsWithNames,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error fetching payments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth()

    const body = await request.json()
    const { memberId, membershipId, amount, method, notes } = body

    if (!memberId || !amount || !method) {
      return NextResponse.json(
        { error: "Member ID, amount, and payment method are required" },
        { status: 400 }
      )
    }

    const member = await prisma.member.findUnique({ where: { id: memberId } })
    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    let membership = null
    if (membershipId) {
      membership = await prisma.membership.findUnique({ where: { id: membershipId } })
      if (!membership) {
        return NextResponse.json(
          { error: "Membership not found" },
          { status: 404 }
        )
      }
    }

    const receiptNo = generateReceiptNo()

    const payment = await prisma.payment.create({
      data: {
        memberId,
        membershipId: membershipId || null,
        amount,
        method,
        status: "PAID",
        receiptNo,
        notes: notes || null,
      },
    })

    if (membership) {
      await prisma.membership.update({
        where: { id: membershipId },
        data: { status: "ACTIVE" },
      })

      await prisma.member.update({
        where: { id: memberId },
        data: { status: "ACTIVE" },
      })
    }

    await logActivity(admin.id, "Recorded payment", "Payment", payment.id, `Recorded payment of ${amount} for ${member.firstName} ${member.lastName}`)

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error creating payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
