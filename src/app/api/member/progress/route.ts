import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMemberAuth } from "@/lib/member-auth"

export async function GET(request: NextRequest) {
  try {
    const member = await requireMemberAuth()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100)
    const skip = (page - 1) * limit

    const where = { memberId: member.id }

    const [logs, total, latestPhoto] = await Promise.all([
      prisma.progressLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        select: {
          id: true,
          weight: true,
          bodyFat: true,
          chest: true,
          waist: true,
          hips: true,
          arms: true,
          thighs: true,
          notes: true,
          date: true,
        },
      }),
      prisma.progressLog.count({ where }),
      prisma.progressPhoto.findFirst({
        where: { memberId: member.id },
        orderBy: { date: "desc" },
        select: {
          id: true,
          url: true,
          type: true,
          date: true,
        },
      }),
    ])

    return NextResponse.json({
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      latestPhoto,
    })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Member progress error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const member = await requireMemberAuth()

    const { weight, bodyFat, chest, waist, hips, arms, thighs, notes } = await request.json()

    const log = await prisma.progressLog.create({
      data: {
        memberId: member.id,
        weight: weight ?? null,
        bodyFat: bodyFat ?? null,
        chest: chest ?? null,
        waist: waist ?? null,
        hips: hips ?? null,
        arms: arms ?? null,
        thighs: thighs ?? null,
        notes: notes ?? null,
      },
      select: {
        id: true,
        weight: true,
        bodyFat: true,
        chest: true,
        waist: true,
        hips: true,
        arms: true,
        thighs: true,
        notes: true,
        date: true,
      },
    })

    return NextResponse.json({ log }, { status: 201 })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Member progress create error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
