import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { createMemberToken, verifyPassword, setMemberCookie } from "@/lib/member-auth"
import { getAppUrl } from "@/lib/constants"

export async function GET() {
  return NextResponse.redirect(new URL("/member/login", getAppUrl()))
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

    await setMemberCookie(token)

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
