import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { requireMemberAuth } from "@/lib/member-auth"

export async function POST(request: NextRequest) {
  try {
    const member = await requireMemberAuth()

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

    // Find the payment record
    const payment = await prisma.payment.findFirst({
      where: {
        razorpayOrderId: razorpay_order_id,
        memberId: member.id,
      },
      include: { membership: true },
    })

    if (!payment) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      )
    }

    // Update payment status
    const updatedPayment = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        razorpayPaymentId: razorpay_payment_id,
      },
    })

    const updates: Promise<unknown>[] = [
      prisma.member.update({
        where: { id: member.id },
        data: { status: "ACTIVE" },
      }),
      prisma.notification.create({
        data: {
          memberId: member.id,
          title: "Payment Successful",
          message: `Your payment of ₹${payment.amount} has been received. Your membership is now active.`,
          type: "PAYMENT",
          link: "/member/membership",
        },
      }),
    ]

    if (payment.membership) {
      updates.push(
        prisma.membership.update({
          where: { id: payment.membership.id },
          data: {
            status: "ACTIVE",
            paymentStatus: "PAID",
          },
        })
      )
    }

    if (payment.membershipId && (!payment.membership || payment.membershipId !== payment.membership.id)) {
      updates.push(
        prisma.membership.update({
          where: { id: payment.membershipId },
          data: { paymentStatus: "PAID" },
        })
      )
    }

    await Promise.all(updates)

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: "Payment verified successfully",
    })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error verifying member payment:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
