import { NextResponse } from "next/server"
import { requireAuth, clearAdminCookie } from "@/lib/auth"

export async function GET() {
  try {
    const admin = await requireAuth()
    return NextResponse.json({ admin })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    await clearAdminCookie()

    return NextResponse.json({ message: "Logged out successfully" })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
