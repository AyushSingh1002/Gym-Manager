import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { createMemberToken, hashPassword } from "@/lib/member-auth"

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, phone, password, email } = await request.json()

    if (!firstName || !lastName || !phone || !password) {
      return NextResponse.json(
        { error: "First name, last name, phone, and password are required" },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      )
    }

    if (phone.length < 10) {
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

    const count = await prisma.member.count()
    const memberId = `GF-${String(count + 1).padStart(6, "0")}`
    const hashedPassword = await hashPassword(password)

    const member = await prisma.member.create({
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

    const token = await createMemberToken({ id: member.id, phone: member.phone })

    const cookieStore = await cookies()
    cookieStore.set("member_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    })

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
