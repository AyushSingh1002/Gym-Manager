import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, logActivity } from "@/lib/auth"
import { calculateEndDate, getPlanAmount, generateReceiptNo } from "@/lib/utils"
import { rateLimitMiddleware } from "@/lib/rate-limit"

const VALID_PLANS = ["MONTHLY", "QUARTERLY", "HALF_YEARLY", "YEARLY", "CUSTOM"]
const VALID_PAYMENT_METHODS = ["CASH", "UPI", "CARD", "ONLINE"]

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { allowed, headers } = rateLimitMiddleware(request)
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers })
    }

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
    const { allowed, headers } = rateLimitMiddleware(request, 10, 60000)
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers })
    }

    const admin = await requireAuth(["ADMIN"])
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

    if (!plan || !VALID_PLANS.includes(plan)) {
      return NextResponse.json(
        { error: "Valid plan is required (MONTHLY, QUARTERLY, HALF_YEARLY, YEARLY, CUSTOM)" },
        { status: 400 }
      )
    }

    const method = paymentMethod || "CASH"
    if (!VALID_PAYMENT_METHODS.includes(method)) {
      return NextResponse.json(
        { error: "Valid payment method is required (CASH, UPI, CARD, ONLINE)" },
        { status: 400 }
      )
    }

    const start = startDate ? new Date(startDate) : new Date()
    const endDate = calculateEndDate(start, plan)
    const amount = getPlanAmount(plan)

    let razorpayOrder = null
    if (method === "ONLINE") {
      razorpayOrder = await createRazorpayOrder(amount)
    }

    const [membership] = await prisma.$transaction(async (tx) => {
      const created = await tx.membership.create({
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

      await tx.member.update({
        where: { id },
        data: { status: "ACTIVE" },
      })

      await tx.notification.create({
        data: {
          memberId: id,
          title: "Membership Assigned",
          message: `A ${plan} membership has been assigned to you. Welcome aboard!`,
          type: "ANNOUNCEMENT",
        },
      })

      if (method === "ONLINE" && razorpayOrder) {
        await tx.payment.create({
          data: {
            memberId: id,
            membershipId: created.id,
            amount,
            method: "ONLINE",
            status: "PENDING",
            razorpayOrderId: razorpayOrder.id,
          },
        })
      } else if (method !== "ONLINE") {
        await tx.payment.create({
          data: {
            memberId: id,
            membershipId: created.id,
            amount,
            method,
            status: "PAID",
            receiptNo: generateReceiptNo(),
          },
        })
      }

      return [created]
    })

    const logMessage = method === "ONLINE"
      ? `Assigned ${plan} membership to ${member.firstName} ${member.lastName} with online payment`
      : `Assigned ${plan} membership to ${member.firstName} ${member.lastName}`

    logActivity(admin.id, "Assigned membership", "Membership", membership.id, logMessage).catch(err => console.error("Failed to log activity:", err))

    return NextResponse.json(
      { membership, ...(razorpayOrder ? { razorpayOrder } : {}) },
      { status: 201 }
    )
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if ((error as Error).message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
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

  let response
  try {
    response = await fetch("https://api.razorpay.com/v1/orders", {
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
  } catch (error) {
    console.error("Network error connecting to Razorpay:", error)
    throw new Error("Network error: Unable to connect to Razorpay. Please check your connection.")
  }

  if (!response.ok) {
    const errorText = await response.text()
    console.error(`Razorpay API error (${response.status}):`, errorText)

    if (response.status === 401 || response.status === 403) {
      throw new Error("Razorpay credentials are invalid")
    }

    throw new Error(`Razorpay API error: ${errorText || response.statusText}`)
  }

  return response.json()
}
