import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createMemberToken, hashPassword, setMemberCookie } from "@/lib/member-auth"
import { PASSWORD_MIN_LENGTH, PHONE_MIN_LENGTH } from "@/lib/constants"
import { rateLimitMiddleware } from "@/lib/rate-limit"

export async function POST(request: NextRequest) {
  try {
    const { allowed, headers } = rateLimitMiddleware(request, 3, 60000)
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers }
      )
    }

    const { firstName, lastName, phone, password, email } = await request.json()

    if (!firstName || !lastName || !phone || !password) {
      return NextResponse.json(
        { error: "First name, last name, phone, and password are required" },
        { status: 400 }
      )
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return NextResponse.json(
        { error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` },
        { status: 400 }
      )
    }

    if (phone.length < PHONE_MIN_LENGTH) {
      return NextResponse.json(
        { error: "Please enter a valid phone number" },
        { status: 400 }
      )
    }

    const existing = await prisma.member.findUnique({ where: { phone } })
    if (existing) {
      return NextResponse.json(
        { error: "An account with this phone number already exists" },
        { status: 409 }
      )
    }

    const hashedPassword = await hashPassword(password)

    const member = await prisma.$transaction(async (tx) => {
      const lastMember = await tx.member.findFirst({
        orderBy: { createdAt: "desc" },
        select: { memberId: true },
      })
      const lastNum = lastMember ? parseInt(lastMember.memberId.replace("GF-", ""), 10) : 0
      const memberId = `GF-${String(lastNum + 1).padStart(6, "0")}`

      return tx.member.create({
        data: {
          memberId,
          firstName,
          lastName,
          phone,
          email: email || null,
          password: hashedPassword,
          status: "ACTIVE",
          isActive: true,
        },
      })
    })

    prisma.notification.create({
      data: {
        memberId: member.id,
        title: "Welcome to GymFlow!",
        message: "Thank you for joining. We're excited to help you on your fitness journey!",
        type: "ANNOUNCEMENT",
      },
    }).catch(err => console.error("Failed to create notification:", err))

    const token = await createMemberToken({ id: member.id, phone: member.phone })

    await setMemberCookie(token)

    return NextResponse.json({
      id: member.id,
      memberId: member.memberId,
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      status: member.status,
    })
  } catch (error) {
    console.error("Member signup error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
