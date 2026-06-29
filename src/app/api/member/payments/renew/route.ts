import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMemberAuth } from "@/lib/member-auth"
import { getPlanAmount, calculateEndDate } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const member = await requireMemberAuth()

    const { plan } = await request.json()

    if (!plan) {
      return NextResponse.json(
        { error: "Plan is required" },
        { status: 400 }
      )
    }

    const amount = getPlanAmount(plan)
    if (amount === 0) {
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      )
    }

    const settings = await prisma.setting.findUnique({ where: { id: "gym" } })
    const keyId = settings?.razorpayKeyId || process.env.RAZORPAY_KEY_ID
    const keySecret = settings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: "Razorpay not configured. Please contact the gym." },
        { status: 400 }
      )
    }

    const startDate = new Date()
    const endDate = calculateEndDate(startDate, plan)
    const activeMembership = await prisma.membership.findFirst({
      where: { memberId: member.id, status: "ACTIVE" },
      orderBy: { endDate: "desc" },
    })

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64")
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: amount * 100,
        currency: "INR",
        receipt: `mem_${member.id}`.slice(0, 40),
        notes: {
          memberId: member.id,
          plan,
          type: "membership_renewal",
        },
      }),
    })

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text()
      console.error("Razorpay order creation failed:", errorText)
      return NextResponse.json(
        { error: "Failed to create Razorpay order" },
        { status: 502 }
      )
    }

    const razorpayOrder = await razorpayResponse.json()
    const payment = await prisma.payment.create({
      data: {
        memberId: member.id,
        membershipId: activeMembership?.id || null,
        amount,
        method: "ONLINE",
        status: "PENDING",
        razorpayOrderId: razorpayOrder.id,
      },
    })

    await prisma.membership.create({
      data: {
        memberId: member.id,
        plan,
        startDate,
        endDate,
        status: "PENDING",
        amount,
        totalAmount: amount,
        notes: "Pending payment renewal",
      },
    })

    return NextResponse.json({
      orderId: razorpayOrder.id,
      amount,
      plan,
      razorpayKeyId: keyId,
      paymentId: payment.id,
    })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Member renew error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
