import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMemberAuth } from "@/lib/member-auth"
import { getPlanAmount, calculateEndDate } from "@/lib/utils"

export async function POST(request: NextRequest) {
  try {
    console.log("=== Renew Payment Request Started ===")
    
    const member = await requireMemberAuth()
    console.log("Member authenticated:", member.id)

    let requestBody
    try {
      requestBody = await request.json()
      console.log("Request body:", requestBody)
    } catch (e) {
      console.error("Failed to parse JSON:", e)
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      )
    }

    const { plan } = requestBody

    if (!plan) {
      console.error("Plan parameter missing")
      return NextResponse.json(
        { error: "Plan is required" },
        { status: 400 }
      )
    }

    console.log("Plan selected:", plan)

    const amount = getPlanAmount(plan)
    console.log("Plan amount:", amount)
    
    if (amount === 0) {
      console.error("Invalid plan:", plan)
      return NextResponse.json(
        { error: "Invalid plan selected" },
        { status: 400 }
      )
    }

    const settings = await prisma.setting.findUnique({ where: { id: "gym" } })
    const keyId = settings?.razorpayKeyId || process.env.RAZORPAY_KEY_ID
    const keySecret = settings?.razorpayKeySecret || process.env.RAZORPAY_KEY_SECRET

    console.log("Razorpay config check:", {
      hasSettingKeyId: !!settings?.razorpayKeyId,
      hasEnvKeyId: !!process.env.RAZORPAY_KEY_ID,
      hasFinalKeyId: !!keyId,
      hasSettingKeySecret: !!settings?.razorpayKeySecret,
      hasEnvKeySecret: !!process.env.RAZORPAY_KEY_SECRET,
      hasFinalKeySecret: !!keySecret,
    })

    if (!keyId || !keySecret) {
      console.error("Razorpay credentials not configured")
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
      console.error("Network error connecting to Razorpay:", fetchError)
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

      console.error(`Razorpay API error (${razorpayResponse.status}):`, errorData)
      
      // Check if it's an authentication error
      if (razorpayResponse.status === 401 || razorpayResponse.status === 403) {
        console.error("Authentication/Authorization failed for Razorpay API")
        return NextResponse.json(
          { 
            error: `Razorpay authentication failed (${razorpayResponse.status}). Your test credentials may be invalid or inactive. Please verify at https://dashboard.razorpay.com/app/keys`,
            details: errorData.error?.description || errorText
          },
          { status: 400 }
        )
      }

      // Bad request error from Razorpay
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
      console.error("Authentication failed")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Member renew error:", error)
    console.error("Error details:", {
      message: (error as Error).message,
      stack: (error as Error).stack,
    })
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
