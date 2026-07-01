import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const text = await request.text()
    const signature = request.headers.get("x-razorpay-signature")

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 })
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET
    if (!keySecret) {
      console.error("RAZORPAY_KEY_SECRET not configured")
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 })
    }

    const expectedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex")

    if (!crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
    }

    const event = JSON.parse(text)

    switch (event.event) {
      case "payment.captured": {
        const paymentEntity = event.payload.payment.entity
        const orderId = paymentEntity.order_id
        const paymentId = paymentEntity.id

        const payment = await prisma.payment.findFirst({
          where: { razorpayOrderId: orderId },
          include: { membership: true },
        })

        if (!payment) {
          console.warn(`No payment record found for order ${orderId}`)
          break
        }

        await prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: "PAID",
            razorpayPaymentId: paymentId,
            transactionId: paymentId,
          },
        })

        const memberName = `${payment.memberId}`

        const updates: Promise<unknown>[] = [
          prisma.member.update({
            where: { id: payment.memberId },
            data: { status: "ACTIVE" },
          }),
          prisma.notification.create({
            data: {
              memberId: payment.memberId,
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
        break
      }

      case "payment.failed": {
        const failedEntity = event.payload.payment.entity
        const failedOrderId = failedEntity.order_id

        const payment = await prisma.payment.findFirst({
          where: { razorpayOrderId: failedOrderId },
          include: { membership: true },
        })

        if (!payment) {
          console.warn(`No payment record found for failed order ${failedOrderId}`)
          break
        }

        await prisma.payment.update({
          where: { id: payment.id },
          data: { status: "FAILED" },
        })

        const updates: Promise<unknown>[] = [
          prisma.notification.create({
            data: {
              memberId: payment.memberId,
              title: "Payment Failed",
              message: `Your payment of ₹${payment.amount} could not be processed. Please try again or use a different payment method.`,
              type: "PAYMENT",
              link: "/member/payments",
            },
          }),
        ]

        if (payment.membership) {
          updates.push(
            prisma.membership.update({
              where: { id: payment.membership.id },
              data: {
                status: "CANCELLED",
                paymentStatus: "FAILED",
              },
            })
          )
        }

        if (payment.membershipId && (!payment.membership || payment.membershipId !== payment.membership.id)) {
          updates.push(
            prisma.membership.update({
              where: { id: payment.membershipId },
              data: { paymentStatus: "FAILED" },
            })
          )
        }

        await Promise.all(updates)
        break
      }

      default:
        console.log(`Unhandled webhook event: ${event.event}`)
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
