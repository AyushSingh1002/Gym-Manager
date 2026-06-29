import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAuth()
    const { id } = await params

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        member: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
              address: true,
          },
        },
        membership: {
          select: {
            id: true,
            plan: true,
            startDate: true,
            endDate: true,
            status: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      )
    }

    const receipt = {
      receiptNo: payment.receiptNo,
      paymentId: payment.id,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      date: payment.createdAt,
      member: payment.member,
      membership: payment.membership,
      razorpayPaymentId: payment.razorpayPaymentId,
      razorpayOrderId: payment.razorpayOrderId,
    }

    return NextResponse.json({ receipt })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error generating receipt:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
