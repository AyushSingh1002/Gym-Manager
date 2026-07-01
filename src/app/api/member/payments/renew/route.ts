import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMemberAuth } from "@/lib/member-auth"
import { getPlanAmount, calculateEndDate } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    const member = await requireMemberAuth()

    let requestBody
    try {
      requestBody = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { plan } = requestBody

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

    const [settings, activeMembership] = await Promise.all([
      prisma.setting.findUnique({ where: { id: "gym" } }),
      prisma.membership.findFirst({
        where: { memberId: member.id, status: "ACTIVE" },
        orderBy: { endDate: "desc" },
      }),
    ])

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

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64")

    let razorpayResponse
    try {
      razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
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
    } catch (fetchError) {
      return NextResponse.json(
        { error: "Network error. Please check your connection and try again." },
        { status: 503 }
      )
    }

    if (!razorpayResponse.ok) {
      const errorText = await razorpayResponse.text()
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { raw: errorText }
      }

      if (razorpayResponse.status === 401 || razorpayResponse.status === 403) {
        return NextResponse.json(
          {
            error: `Razorpay authentication failed (${razorpayResponse.status}). Your test credentials may be invalid or inactive.`,
            details: errorData.error?.description || errorText
          },
          { status: 400 }
        )
      }

      if (razorpayResponse.status === 400) {
        return NextResponse.json(
          {
            error: "Invalid request to Razorpay",
            details: errorData.error?.description || errorText
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          error: `Razorpay API error (${razorpayResponse.status})`,
          details: errorData.error?.description || errorText
        },
        { status: 502 }
      )
    }

    const razorpayOrder = await razorpayResponse.json()

    const [payment, membership] = await Promise.all([
      prisma.payment.create({
        data: {
          memberId: member.id,
          membershipId: activeMembership?.id || null,
          amount,
          method: "ONLINE",
          status: "PENDING",
          razorpayOrderId: razorpayOrder.id,
        },
      }),
      prisma.membership.create({
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
      }),
    ])

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
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
