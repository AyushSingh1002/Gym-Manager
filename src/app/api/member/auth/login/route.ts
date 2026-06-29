import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { createMemberToken, verifyPassword } from "@/lib/member-auth"

export async function GET() {
  return NextResponse.redirect(new URL("/member/login", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"))
}

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json()

    if (!phone || !password) {
      return NextResponse.json(
        { error: "Phone and password are required" },
        { status: 400 }
      )
    }

    const member = await prisma.member.findUnique({ where: { phone } })

    if (!member) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    if (!member.password) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    const isValid = await verifyPassword(password, member.password)

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

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
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email,
      phone: member.phone,
      photo: member.photo,
      status: member.status,
      memberId: member.memberId,
    })
  } catch (error) {
    console.error("Member login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
