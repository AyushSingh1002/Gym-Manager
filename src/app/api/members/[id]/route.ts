import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAuth, logActivity } from "@/lib/auth"
import { rateLimitMiddleware } from "@/lib/rate-limit"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { allowed, headers } = rateLimitMiddleware(request)
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers })
    }

    const admin = await requireAuth()
    const { id } = await params

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        memberships: {
          orderBy: { createdAt: "desc" },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
        attendance: {
          orderBy: { date: "desc" },
          take: 50,
        },
      },
    })

    if (!member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ member })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Error fetching member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { allowed, headers } = rateLimitMiddleware(request, 20, 60000)
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers })
    }

    const admin = await requireAuth(["ADMIN"])
    const { id } = await params

    const existing = await prisma.member.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { firstName, lastName, email, phone, dateOfBirth, gender, address, alternatePhone, city, state, pincode, emergencyName, emergencyPhone, emergencyRelation, notes, status } = body

    if (phone && phone !== existing.phone) {
      const phoneExists = await prisma.member.findFirst({ where: { phone } })
      if (phoneExists) {
        return NextResponse.json(
          { error: "A member with this phone number already exists" },
          { status: 409 }
        )
      }
    }

    const member = await prisma.member.update({
      where: { id },
      data: {
        ...(firstName !== undefined && { firstName }),
        ...(lastName !== undefined && { lastName }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
        ...(gender !== undefined && { gender }),
        ...(address !== undefined && { address }),
        ...(alternatePhone !== undefined && { alternatePhone }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
        ...(pincode !== undefined && { pincode }),
        ...(emergencyName !== undefined && { emergencyName }),
        ...(emergencyPhone !== undefined && { emergencyPhone }),
        ...(emergencyRelation !== undefined && { emergencyRelation }),
        ...(notes !== undefined && { notes }),
        ...(status !== undefined && { status }),
      },
    })

    logActivity(admin.id, "Updated member", "Member", id, `Updated member ${member.firstName} ${member.lastName}`).catch(err => console.error("Failed to log activity:", err))

    return NextResponse.json({ member })
  } catch (error) {
      if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if ((error as Error).message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("Error updating member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { allowed, headers } = rateLimitMiddleware(request, 10, 60000)
    if (!allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429, headers })
    }

    const admin = await requireAuth(["ADMIN"])
    const { id } = await params

    const existing = await prisma.member.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      )
    }

    const member = await prisma.member.update({
      where: { id },
      data: { status: "CANCELLED", isActive: false },
    })

    logActivity(admin.id, "Deactivated member", "Member", id, `Deactivated member ${member.firstName} ${member.lastName}`).catch(err => console.error("Failed to log activity:", err))

    return NextResponse.json({ message: "Member deactivated successfully", member })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    if ((error as Error).message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    console.error("Error deactivating member:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
