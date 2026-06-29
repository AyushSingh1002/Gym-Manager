import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMemberAuth } from "@/lib/member-auth"

export async function GET() {
  try {
    const member = await requireMemberAuth()

    const plans = await prisma.workoutPlan.findMany({
      where: { memberId: member.id, isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        notes: true,
        exercises: {
          orderBy: [{ dayOfWeek: "asc" }, { order: "asc" }],
          select: {
            id: true,
            name: true,
            sets: true,
            reps: true,
            weight: true,
            restTime: true,
            dayOfWeek: true,
            order: true,
            notes: true,
          },
        },
      },
    })

    const grouped = plans.map((plan) => {
      const groupedByDay: Record<number, typeof plan.exercises> = {}
      for (const exercise of plan.exercises) {
        if (!groupedByDay[exercise.dayOfWeek]) {
          groupedByDay[exercise.dayOfWeek] = []
        }
        groupedByDay[exercise.dayOfWeek].push(exercise)
      }
      return {
        id: plan.id,
        name: plan.name,
        description: plan.description,
        startDate: plan.startDate,
        endDate: plan.endDate,
        notes: plan.notes,
        exercises: groupedByDay,
      }
    })

    return NextResponse.json({ plans: grouped })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Member workouts error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
