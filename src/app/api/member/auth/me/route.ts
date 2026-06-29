import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getCurrentMember } from "@/lib/member-auth"

export async function GET() {
  try {
    const member = await getCurrentMember()
    if (!member) {
      return NextResponse.json({ member: null }, { status: 401 })
    }
    return NextResponse.json({ member })
  } catch (error) {
    console.error("Member session error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    const cookieStore = await cookies()
    cookieStore.set("member_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
    })

    return NextResponse.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Member logout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
