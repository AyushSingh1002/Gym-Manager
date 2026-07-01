import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { requireAuth, logActivity } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAuth()

    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment verification fields" },
        { status: 400 }
      )
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      console.error("RAZORPAY_KEY_SECRET not configured")
      return NextResponse.json(
        { error: "Razorpay not configured on server" },
        { status: 500 }
      )
    }

    // Verify the signature
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex")

    if (generatedSignature !== razorpay_signature) {
      console.warn(
        `Signature mismatch for order ${razorpay_order_id}. Expected: ${generatedSignature}, Got: ${razorpay_signature}`
      )
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      )
    }

    const existingPayment = await prisma.payment.findFirst({
      where: { razorpayOrderId: razorpay_order_id },
      include: { membership: true },
    })

    if (!existingPayment) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      )
    }

    const payment = await prisma.payment.update({
      where: { id: existingPayment.id },
      data: {
        status: "PAID",
        razorpayPaymentId: razorpay_payment_id,
      },
    })

    if (existingPayment.membership) {
      await Promise.all([
        prisma.membership.update({
          where: { id: existingPayment.membership.id },
          data: { status: "ACTIVE" },
        }),
        prisma.member.update({
          where: { id: existingPayment.memberId },
          data: { status: "ACTIVE" },
        }),
      ])
    }

    logActivity(
      admin.id,
      "Payment verified",
      "Payment",
      payment.id,
      `Payment of ${payment.amount} verified via Razorpay`
    ).catch(err => console.error("Failed to log activity:", err))

    return NextResponse.json({ payment })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error verifying payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
