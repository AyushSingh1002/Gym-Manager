import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth } from "@/lib/auth"

export async function GET() {
  try {
    const admin = await requireAuth()

    let settings = await prisma.setting.findFirst()

    if (!settings) {
      settings = await prisma.setting.create({
        data: { id: "gym" },
      })
    }

    const { razorpayKeySecret: _, ...safeSettings } = settings
    return NextResponse.json(safeSettings)
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if ((error as Error).message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("Error fetching settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const admin = await requireAuth(["ADMIN"])

    const body = await request.json()
    const { name, tagline, address, phone, email, website, currency, timezone, gstNumber, logo, razorpayKeyId, razorpayKeySecret } = body

    let settings = await prisma.setting.findFirst()

    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          id: "gym",
          ...(name !== undefined && { name }),
          ...(tagline !== undefined && { tagline }),
          ...(address !== undefined && { address }),
          ...(phone !== undefined && { phone }),
          ...(email !== undefined && { email }),
          ...(website !== undefined && { website }),
          ...(currency !== undefined && { currency }),
          ...(timezone !== undefined && { timezone }),
          ...(gstNumber !== undefined && { gstNumber }),
          ...(logo !== undefined && { logo }),
          ...(razorpayKeyId !== undefined && { razorpayKeyId }),
          ...(razorpayKeySecret !== undefined && { razorpayKeySecret }),
        },
      })
    } else {
      settings = await prisma.setting.update({
        where: { id: settings.id },
        data: {
          ...(name !== undefined && { name }),
          ...(tagline !== undefined && { tagline }),
          ...(address !== undefined && { address }),
          ...(phone !== undefined && { phone }),
          ...(email !== undefined && { email }),
          ...(website !== undefined && { website }),
          ...(currency !== undefined && { currency }),
          ...(timezone !== undefined && { timezone }),
          ...(gstNumber !== undefined && { gstNumber }),
          ...(logo !== undefined && { logo }),
          ...(razorpayKeyId !== undefined && { razorpayKeyId }),
          ...(razorpayKeySecret !== undefined && { razorpayKeySecret }),
        },
      })
    }

    const { razorpayKeySecret: _, ...safeSettings } = settings
    return NextResponse.json(safeSettings)
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if ((error as Error).message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
