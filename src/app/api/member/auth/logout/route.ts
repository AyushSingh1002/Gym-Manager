import { NextResponse } from "next/server"
import { clearMemberCookie } from "@/lib/member-auth"

export async function POST() {
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
