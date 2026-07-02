import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireMemberAuth } from "@/lib/member-auth"

export async function GET() {
  try {
    const member = await requireMemberAuth()

    const plans = await prisma.workoutPlan.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        description: true,
        startDate: true,
        endDate: true,
        notes: true,
        isActive: true,
        createdByAdmin: {
          select: { name: true },
        },
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
            completed: true,
          },
        },
      },
    })

    const activePlan = plans.find((p) => p.isActive) || null
    const pastPlans = plans.filter((p) => !p.isActive)

    const mapPlan = (plan: typeof plans[0]) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description || "",
      startDate: plan.startDate.toISOString(),
      endDate: plan.endDate?.toISOString() || plan.startDate.toISOString(),
      assignedBy: plan.createdByAdmin?.name || "Admin",
      status: plan.isActive ? "ACTIVE" : "COMPLETED",
      exercises: plan.exercises.map((e) => ({
        id: e.id,
        name: e.name,
        sets: e.sets || 0,
        reps: e.reps || 0,
        weight: e.weight || null,
        restTime: e.restTime || 0,
        dayOfWeek: String(e.dayOfWeek),
        order: e.order,
        completed: e.completed,
      })),
    })

    return NextResponse.json({
      activePlan: activePlan ? mapPlan(activePlan) : null,
      pastPlans: pastPlans.map(mapPlan),
    })
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

export async function PATCH(request: NextRequest) {
  try {
    const member = await requireMemberAuth()

    const { exerciseId, completed } = await request.json()

    if (!exerciseId) {
      return NextResponse.json(
        { error: "Exercise ID is required" },
        { status: 400 }
      )
    }

    const exercise = await prisma.workoutExercise.findUnique({
      where: { id: exerciseId },
      include: {
        workoutPlan: { select: { memberId: true } },
      },
    })

    if (!exercise || exercise.workoutPlan.memberId !== member.id) {
      return NextResponse.json(
        { error: "Exercise not found" },
        { status: 404 }
      )
    }

    const updated = await prisma.workoutExercise.update({
      where: { id: exerciseId },
      data: { completed },
    })

    return NextResponse.json({ exercise: updated })
  } catch (error) {
    if ((error as Error).message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    console.error("Member workout update error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
