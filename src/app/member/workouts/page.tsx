"use client"
import { useState, useEffect } from "react"
import { Dumbbell, CheckCircle, Circle, ChevronDown, ChevronUp, Calendar, Clock, Target, User, Award, Sparkles, AlertCircle } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatDate, getDaysRemaining } from "@/lib/utils"

interface Exercise {
  id: string
  name: string
  sets: number
  reps: number
  weight: number | null
  restTime: number
  dayOfWeek: string
  order: number
  completed: boolean
}

interface WorkoutPlan {
  id: string
  name: string
  description: string
  startDate: string
  endDate: string
  assignedBy: string | null
  status: string
  exercises: Exercise[]
}

interface WorkoutData {
  activePlan: WorkoutPlan | null
  pastPlans: WorkoutPlan[]
}

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const DAY_MAP: Record<string, string> = {
  MONDAY: "Mon", TUESDAY: "Tue", WEDNESDAY: "Wed",
  THURSDAY: "Thu", FRIDAY: "Fri", SATURDAY: "Sat", SUNDAY: "Sun",
}

function SkeletonLine({ width }: { width: string }) {
  return <div className={`h-4 ${width} bg-gray-200 dark:bg-gray-700 rounded animate-pulse`} />
}

function SkeletonBlock() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-4 w-72 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-4">
        <div className="h-24 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-950/30 dark:to-purple-950/30 rounded-lg" />
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-8 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-3">
            <div className="h-5 w-5 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
            <div className="flex-1 space-y-1.5">
              <SkeletonLine width="w-36" />
              <SkeletonLine width="w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function MemberWorkouts() {
  const [data, setData] = useState<WorkoutData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeDay, setActiveDay] = useState<string | null>(null)
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set())
  const [pastOpen, setPastOpen] = useState(false)
  const [animatingIds, setAnimatingIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/member/workouts")
      if (!res.ok) throw new Error("Failed to load workouts")
      const json: WorkoutData = await res.json()
      setData(json)
      if (json.activePlan && json.activePlan.exercises.length > 0) {
        const days = [...new Set(json.activePlan.exercises.map((e) => e.dayOfWeek))]
        const firstDay = DAY_MAP[days[0]] || days[0]
        setActiveDay(firstDay)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function toggleExercise(exerciseId: string, currentCompleted: boolean) {
    const newCompleted = !currentCompleted
    setCompletedExercises((prev) => {
      const next = new Set(prev)
      if (newCompleted) next.add(exerciseId)
      else next.delete(exerciseId)
      return next
    })
    setAnimatingIds((prev) => new Set(prev).add(exerciseId))
    setTimeout(() => setAnimatingIds((prev) => { const n = new Set(prev); n.delete(exerciseId); return n }), 400)

    try {
      const res = await fetch("/api/member/workouts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exerciseId, completed: newCompleted }),
      })
      if (!res.ok) {
        setCompletedExercises((prev) => {
          const next = new Set(prev)
          if (currentCompleted) next.add(exerciseId)
          else next.delete(exerciseId)
          return next
        })
      }
    } catch {
      setCompletedExercises((prev) => {
        const next = new Set(prev)
        if (currentCompleted) next.add(exerciseId)
        else next.delete(exerciseId)
        return next
      })
    }
  }

  if (loading) return <div className="space-y-6 animate-in fade-in"><SkeletonBlock /></div>

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
        <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load workouts</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <Button onClick={fetchData} className="mt-4">Try Again</Button>
      </div>
    )
  }

  if (!data || (!data.activePlan && data.pastPlans.length === 0)) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Workout Plans</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your personalized training program</p>
          </div>
          <div className="rounded-xl bg-indigo-500/10 p-3 dark:bg-indigo-400/10">
            <Dumbbell className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-20">
          <div className="rounded-full bg-gray-100 p-6 dark:bg-gray-800">
            <Dumbbell className="h-12 w-12 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">No workout plans yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            Your trainer hasn't assigned any workout plans yet. Once they do, you'll see them here.
          </p>
        </div>
      </div>
    )
  }

  const { activePlan, pastPlans } = data
  const isCompleted = (id: string) => completedExercises.has(id)

  const activeExercises = activePlan?.exercises || []
  const availableDays = [...new Set(activeExercises.map((e) => DAY_MAP[e.dayOfWeek] || e.dayOfWeek))]
  const currentDayExercises = activeDay
    ? activeExercises.filter((e) => (DAY_MAP[e.dayOfWeek] || e.dayOfWeek) === activeDay)
    : []

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Workout Plans</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Your personalized training program</p>
        </div>
        <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-3 shadow-lg">
          <Dumbbell className="h-6 w-6 text-white" />
        </div>
      </div>

      {/* Active Plan */}
      {activePlan && (
        <Card className="overflow-hidden border-0 shadow-lg">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 p-6 text-white">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-300" />
                  <h2 className="text-xl font-bold">{activePlan.name}</h2>
                </div>
                {activePlan.description && (
                  <p className="text-sm text-white/80">{activePlan.description}</p>
                )}
              </div>
              <Badge status="ACTIVE">Active</Badge>
            </div>
          </div>
          <CardContent className="p-6 space-y-6">
            {/* Plan Details */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Start
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(activePlan.startDate)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  End
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(activePlan.endDate)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <Clock className="h-3.5 w-3.5" />
                  Remaining
                </div>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                  {getDaysRemaining(new Date(activePlan.endDate))} days
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-1">
                  <User className="h-3.5 w-3.5" />
                  Trainer
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {activePlan.assignedBy || "Admin"}
                </p>
              </div>
            </div>

            {/* Day Selector */}
            <div>
              <div className="flex items-center gap-1.5 mb-3">
                <Target className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Select Day</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const hasExercises = availableDays.includes(day)
                  const isActive = activeDay === day
                  return (
                    <button
                      key={day}
                      onClick={() => hasExercises && setActiveDay(day)}
                      disabled={!hasExercises}
                      className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/25 scale-105"
                          : hasExercises
                            ? "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            : "bg-gray-50 text-gray-300 cursor-not-allowed dark:bg-gray-800/50 dark:text-gray-600"
                      }`}
                    >
                      {day}
                      {hasExercises && isActive && (
                        <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-gray-900 animate-pulse" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Exercise List */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Dumbbell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {activeDay ? `${activeDay} — Exercises` : "Select a day"}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {currentDayExercises.filter((e) => isCompleted(e.id)).length}/{currentDayExercises.length} done
                </span>
              </div>

              {currentDayExercises.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <Dumbbell className="h-8 w-8 text-gray-300 dark:text-gray-600 mb-2" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No exercises for this day</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {currentDayExercises
                    .sort((a, b) => a.order - b.order)
                    .map((exercise) => {
                      const completed = isCompleted(exercise.id)
                      const isAnimating = animatingIds.has(exercise.id)
                      return (
                        <div
                          key={exercise.id}
                          className={`group rounded-xl border transition-all duration-300 ${
                            completed
                              ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/20"
                              : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:hover:border-gray-600"
                          } ${isAnimating ? "scale-[0.98] opacity-80" : ""}`}
                        >
                          <div className="flex items-center gap-4 p-4">
                            <button
                              onClick={() => toggleExercise(exercise.id, completed)}
                              className={`shrink-0 transition-all duration-200 ${
                                completed
                                  ? "text-emerald-500 scale-110"
                                  : "text-gray-300 hover:text-indigo-400 dark:text-gray-600 dark:hover:text-indigo-400"
                              }`}
                            >
                              {completed ? (
                                <CheckCircle className="h-6 w-6" />
                              ) : (
                                <Circle className="h-6 w-6" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">#{exercise.order}</span>
                                <p className={`text-sm font-semibold truncate ${
                                  completed
                                    ? "text-emerald-700 line-through dark:text-emerald-400"
                                    : "text-gray-900 dark:text-gray-100"
                                }`}>
                                  {exercise.name}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/30 px-2 py-0.5 rounded">
                                  <Target className="h-3 w-3" />
                                  {exercise.sets} × {exercise.reps}
                                </span>
                                {exercise.weight && (
                                  <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                    <Award className="h-3 w-3" />
                                    {exercise.weight} kg
                                  </span>
                                )}
                                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <Clock className="h-3 w-3" />
                                  {exercise.restTime}s
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Past Plans */}
      {pastPlans.length > 0 && (
        <Card>
          <button
            onClick={() => setPastOpen(!pastOpen)}
            className="w-full flex items-center justify-between p-6 text-left"
          >
            <div className="flex items-center gap-2">
              <Award className="h-5 w-5 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Past Plans
              </h3>
              <span className="rounded-full bg-gray-100 dark:bg-gray-800 px-2 py-0.5 text-xs font-medium text-gray-500">
                {pastPlans.length}
              </span>
            </div>
            {pastOpen ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              pastOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="px-6 pb-6 space-y-3 border-t border-gray-100 dark:border-gray-800 pt-4">
              {pastPlans.map((plan) => (
                <div
                  key={plan.id}
                  className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{plan.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(plan.startDate)} — {formatDate(plan.endDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {plan.exercises.length} exercise{plan.exercises.length !== 1 ? "s" : ""}
                    </span>
                    <Badge status="EXPIRED">Completed</Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
