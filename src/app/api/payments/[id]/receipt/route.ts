import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"
import { generateReceiptPDF } from "@/lib/pdf/receipt"

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
            memberId: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            gender: true,
            dateOfBirth: true,
          },
        },
        membership: {
          select: {
            id: true,
            plan: true,
            startDate: true,
            endDate: true,
            status: true,
            discount: true,
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

    let settings = await prisma.setting.findFirst()
    if (!settings) {
      settings = await prisma.setting.create({
        data: { id: "gym" },
      })
    }

    const adminName = admin.name || admin.email || "Admin"

    const pdfBytes = await generateReceiptPDF({
      payment: {
        id: payment.id,
        receiptNo: payment.receiptNo,
        amount: payment.amount,
        method: payment.method,
        status: payment.status,
        date: payment.createdAt,
        razorpayPaymentId: payment.razorpayPaymentId,
        razorpayOrderId: payment.razorpayOrderId,
        notes: payment.notes,
      },
      member: {
        id: payment.member.id,
        memberId: payment.member.memberId,
        firstName: payment.member.firstName,
        lastName: payment.member.lastName,
        phone: payment.member.phone,
        email: payment.member.email,
        address: payment.member.address,
        city: payment.member.city,
        state: payment.member.state,
        pincode: payment.member.pincode,
        gender: payment.member.gender,
        dateOfBirth: payment.member.dateOfBirth,
      },
      membership: payment.membership
        ? {
            id: payment.membership.id,
            plan: payment.membership.plan,
            startDate: payment.membership.startDate,
            endDate: payment.membership.endDate,
            status: payment.membership.status,
            discount: payment.membership.discount,
          }
        : null,
      settings: {
        name: settings.name,
        tagline: settings.tagline,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        currency: settings.currency,
        gstNumber: settings.gstNumber,
        logo: settings.logo,
      },
      adminName,
    })

    const receiptNo = payment.receiptNo || payment.id.slice(0, 8).toUpperCase()
    const filename = `receipt-${receiptNo}.pdf`

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": pdfBytes.length.toString(),
      },
    })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error generating receipt PDF:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
