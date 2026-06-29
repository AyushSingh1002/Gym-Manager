import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMemberAuth, hashPassword } from "@/lib/member-auth"

export async function PATCH(request: NextRequest) {
  try {
    const member = await requireMemberAuth()

    const body = await request.json()
    const {
      firstName,
      lastName,
      email,
      alternatePhone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
      pincode,
      emergencyName,
      emergencyPhone,
      emergencyRelation,
      weight,
      height,
      goal,
      fitnessLevel,
      password,
    } = body

    const data: Record<string, unknown> = {}

    if (firstName !== undefined) data.firstName = firstName
    if (lastName !== undefined) data.lastName = lastName
    if (email !== undefined) data.email = email
    if (alternatePhone !== undefined) data.alternatePhone = alternatePhone
    if (dateOfBirth !== undefined) data.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null
    if (gender !== undefined) data.gender = gender
    if (address !== undefined) data.address = address
    if (city !== undefined) data.city = city
    if (state !== undefined) data.state = state
    if (pincode !== undefined) data.pincode = pincode
    if (emergencyName !== undefined) data.emergencyName = emergencyName
    if (emergencyPhone !== undefined) data.emergencyPhone = emergencyPhone
    if (emergencyRelation !== undefined) data.emergencyRelation = emergencyRelation
    if (weight !== undefined) data.weight = weight
    if (height !== undefined) data.height = height
    if (goal !== undefined) data.goal = goal
    if (fitnessLevel !== undefined) data.fitnessLevel = fitnessLevel
    if (password) data.password = await hashPassword(password)

    const updated = await prisma.member.update({
      where: { id: member.id },
      data,
      select: {
        id: true,
        memberId: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        alternatePhone: true,
        photo: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        city: true,
        state: true,
        pincode: true,
        emergencyName: true,
        emergencyPhone: true,
        emergencyRelation: true,
        weight: true,
        height: true,
        goal: true,
        fitnessLevel: true,
        status: true,
      },
    })

    return NextResponse.json({ member: updated })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Member profile update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
