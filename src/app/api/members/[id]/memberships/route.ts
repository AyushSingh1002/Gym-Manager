import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, logActivity } from "@/lib/auth"
import { calculateEndDate, getPlanAmount } from "@/lib/utils"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth()
    const { id } = await params

    const member = await prisma.member.findUnique({ where: { id } })
    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    const memberships = await prisma.membership.findMany({
      where: { memberId: id },
      orderBy: { createdAt: "desc" },
      include: {
        payments: true,
      },
    })

    return NextResponse.json({ memberships })
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth()
    const { id } = await params

    const member = await prisma.member.findUnique({ where: { id } })
    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { plan, startDate, paymentMethod, notes } = body

    if (!plan) {
      return NextResponse.json(
        { error: "Plan is required" },
        { status: 400 }
      )
    }

    const start = startDate ? new Date(startDate) : new Date()
    const endDate = calculateEndDate(start, plan)

    const amount = getPlanAmount(plan)
    const membership = await prisma.membership.create({
      data: {
        memberId: id,
        plan,
        startDate: start,
        endDate,
        status: "ACTIVE",
        amount,
        totalAmount: amount,
        notes: notes || null,
      },
    })

    await prisma.member.update({
      where: { id },
      data: { status: "ACTIVE" },
    })

    if (paymentMethod === "ONLINE") {
      const razorpayOrder = await createRazorpayOrder(amount)

      await prisma.payment.create({
        data: {
          memberId: id,
          membershipId: membership.id,
          amount,
          method: "ONLINE",
          status: "PENDING",
          razorpayOrderId: razorpayOrder.id,
        },
      })

      await logActivity(admin.id, "Assigned membership", "Membership", membership.id, `Assigned ${plan} membership to ${member.firstName} ${member.lastName} with online payment`)

      return NextResponse.json({ membership, razorpayOrder }, { status: 201 })
    }

    await logActivity(admin.id, "Assigned membership", "Membership", membership.id, `Assigned ${plan} membership to ${member.firstName} ${member.lastName}`)

    return NextResponse.json({ membership }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error creating membership:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

async function createRazorpayOrder(amount: number) {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials not configured")
  }

  const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64")

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify({
      amount: amount * 100,
      currency: "INR",
      receipt: `mem_${Date.now()}`,
    }),
  })

  if (!response.ok) {
    throw new Error("Failed to create Razorpay order")
  }

  return response.json()
}
