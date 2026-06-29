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

    return NextResponse.json(settings)
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
    const admin = await requireAuth()

    const body = await request.json()
    const { name, address, phone, email, website, currency, timezone, razorpayKeyId, razorpayKeySecret } = body

    let settings = await prisma.setting.findFirst()

    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          id: "gym",
          ...(name !== undefined && { name }),
          ...(address !== undefined && { address }),
          ...(phone !== undefined && { phone }),
          ...(email !== undefined && { email }),
          ...(website !== undefined && { website }),
          ...(currency !== undefined && { currency }),
          ...(timezone !== undefined && { timezone }),
          ...(razorpayKeyId !== undefined && { razorpayKeyId }),
          ...(razorpayKeySecret !== undefined && { razorpayKeySecret }),
        },
      })
    } else {
      settings = await prisma.setting.update({
        where: { id: settings.id },
        data: {
          ...(name !== undefined && { name }),
          ...(address !== undefined && { address }),
          ...(phone !== undefined && { phone }),
          ...(email !== undefined && { email }),
          ...(website !== undefined && { website }),
          ...(currency !== undefined && { currency }),
          ...(timezone !== undefined && { timezone }),
          ...(razorpayKeyId !== undefined && { razorpayKeyId }),
          ...(razorpayKeySecret !== undefined && { razorpayKeySecret }),
        },
      })
    }

    return NextResponse.json(settings)
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error updating settings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
