import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMemberAuth } from "@/lib/member-auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const faqs = searchParams.get("faqs")

    if (faqs === "true") {
      const faqList = await prisma.fAQ.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
        select: {
          id: true,
          question: true,
          answer: true,
        },
      })

      return NextResponse.json({ faqs: faqList })
    }

    const member = await requireMemberAuth()

    const tickets = await prisma.supportTicket.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        subject: true,
        message: true,
        status: true,
        adminReply: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ tickets })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Member support error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const member = await requireMemberAuth()

    const { subject, message } = await request.json()

    if (!subject || !message) {
      return NextResponse.json(
        { error: "Subject and message are required" },
        { status: 400 }
      )
    }

    const ticket = await prisma.supportTicket.create({
      data: {
        memberId: member.id,
        subject,
        message,
      },
      select: {
        id: true,
        subject: true,
        message: true,
        status: true,
        createdAt: true,
      },
    })

    prisma.activityLog.create({
      data: {
        action: "CREATED",
        entity: "SupportTicket",
        entityId: ticket.id,
        details: `Member created support ticket: ${subject}`,
      },
    }).catch(err => console.error("Failed to log activity:", err))

    return NextResponse.json({ ticket }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Member support create error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
