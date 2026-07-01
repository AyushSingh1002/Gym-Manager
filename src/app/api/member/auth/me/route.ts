import { NextResponse } from "next/server"
import { getCurrentMember, clearMemberCookie } from "@/lib/member-auth"

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
    await clearMemberCookie()

    return NextResponse.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Member logout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
