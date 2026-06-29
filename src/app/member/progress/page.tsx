"use client"
import { useState, useEffect } from "react"
import { BarChart3, Activity, Weight, Ruler, Camera, Plus, TrendingUp, TrendingDown, Minus, ChevronRight, Calendar, Upload, AlertCircle, Sparkles } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { formatDate } from "@/lib/utils"

interface ProgressLog {
  id: string
  date: string
  weight: number | null
  bodyFat: number | null
  chest: number | null
  waist: number | null
  hips: number | null
  arms: number | null
  thighs: number | null
  notes: string | null
}

interface ProgressPhoto {
  id: string
  url: string
  date: string
  type: "front" | "back" | "side" | "other"
}

interface ProgressData {
  logs: ProgressLog[]
  photos: ProgressPhoto[]
}

interface MeasurementField {
  key: keyof Omit<ProgressLog, "id" | "date" | "notes">
  label: string
  unit: string
  icon: React.ElementType
  improving: "lower" | "higher"
}

const MEASUREMENT_FIELDS: MeasurementField[] = [
  { key: "weight", label: "Weight", unit: "kg", icon: Weight, improving: "lower" },
  { key: "bodyFat", label: "Body Fat", unit: "%", icon: Activity, improving: "lower" },
  { key: "chest", label: "Chest", unit: "cm", icon: Ruler, improving: "higher" },
  { key: "waist", label: "Waist", unit: "cm", icon: Ruler, improving: "lower" },
  { key: "hips", label: "Hips", unit: "cm", icon: Ruler, improving: "higher" },
  { key: "arms", label: "Arms", unit: "cm", icon: Ruler, improving: "higher" },
  { key: "thighs", label: "Thighs", unit: "cm", icon: Ruler, improving: "higher" },
]

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 animate-pulse space-y-4">
      <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded" />
      <div className="h-3 w-12 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  )
}

function TrendingIndicator({ current, previous, improving }: { current: number; previous: number | null; improving: "lower" | "higher" }) {
  if (previous === null) return <Minus className="h-4 w-4 text-gray-400" />
  const diff = current - previous
  const isGood = improving === "lower" ? diff < 0 : diff > 0
  const isNeutral = diff === 0
  if (isNeutral) return <Minus className="h-4 w-4 text-gray-400" />
  return isGood ? (
    <TrendingDown className="h-4 w-4 text-emerald-500" />
  ) : (
    <TrendingUp className="h-4 w-4 text-red-500" />
  )
}

function WeightChart({ logs }: { logs: ProgressLog[] }) {
  const validLogs = logs.filter((l) => l.weight != null).reverse()
  if (validLogs.length < 2) return null

  const values = validLogs.map((l) => l.weight!)
  const min = Math.min(...values) - 2
  const max = Math.max(...values) + 2
  const range = max - min || 1
  const width = 600
  const height = 200
  const padding = { top: 20, right: 20, bottom: 30, left: 40 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const points = validLogs.map((log, i) => ({
    x: padding.left + (i / Math.max(validLogs.length - 1, 1)) * chartW,
    y: padding.top + chartH - ((log.weight! - min) / range) * chartH,
    date: log.date,
    weight: log.weight!,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`

  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const val = min + (range / 4) * i
    return { y: padding.top + chartH - ((val - min) / range) * chartH, label: Math.round(val * 10) / 10 }
  })

  const xLabels = points.filter((_, i) => i === 0 || i === points.length - 1 || i % Math.max(1, Math.floor(points.length / 4)) === 0)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(99,102,241,0.3)" />
          <stop offset="100%" stopColor="rgba(99,102,241,0.01)" />
        </linearGradient>
      </defs>

      {yTicks.map((tick, i) => (
        <g key={i}>
          <line x1={padding.left} y1={tick.y} x2={width - padding.right} y2={tick.y} stroke="#e5e7eb" strokeWidth="1" />
          <text x={padding.left - 8} y={tick.y + 4} textAnchor="end" className="text-[10px] fill-gray-400">{tick.label}</text>
        </g>
      ))}

      <path d={areaPath} fill="url(#weightGradient)" />
      <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="#6366f1" stroke="white" strokeWidth="2" className="transition-all duration-300 hover:r-6 cursor-pointer">
            <title>{formatDate(p.date)}: {p.weight} kg</title>
          </circle>
        </g>
      ))}

      {xLabels.map((p, i) => (
        <text key={i} x={p.x} y={height - 5} textAnchor="middle" className="text-[10px] fill-gray-400">
          {new Date(p.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </text>
      ))}
    </svg>
  )
}

export default function MemberProgress() {
  const [data, setData] = useState<ProgressData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showPhotoUpload, setShowPhotoUpload] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedLog, setSelectedLog] = useState<ProgressLog | null>(null)
  const [form, setForm] = useState({
    weight: "", bodyFat: "", chest: "", waist: "", hips: "", arms: "", thighs: "", notes: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/member/progress")
      if (!res.ok) throw new Error("Failed to load progress data")
      const json: ProgressData = await res.json()
      setData(json)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  function handleFormChange(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const body: Record<string, string | number | null> = {}
      for (const [key, value] of Object.entries(form)) {
        body[key] = value === "" ? null : parseFloat(value)
        if (key === "notes") body[key] = value
      }
      const res = await fetch("/api/member/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to save progress")
      setShowModal(false)
      setForm({ weight: "", bodyFat: "", chest: "", waist: "", hips: "", arms: "", thighs: "", notes: "" })
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const formData = new FormData()
    formData.append("photo", file)
    try {
      const res = await fetch("/api/member/upload", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Failed to upload photo")
      setShowPhotoUpload(false)
      await fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : "Something went wrong")
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
        <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load progress</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <Button onClick={fetchData} className="mt-4">Try Again</Button>
      </div>
    )
  }

  const logs = data?.logs || []
  const photos = data?.photos || []
  const latestLog = logs[0] || null
  const firstLog = logs[logs.length - 1] || null
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const getLatestVal = (key: keyof ProgressLog) => {
    const val = latestLog?.[key] as number | null | undefined
    return val != null ? val : null
  }

  const getPreviousVal = (key: keyof ProgressLog) => {
    if (logs.length < 2) return null
    const val = logs[1]?.[key] as number | null | undefined
    return val != null ? val : null
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-3 shadow-lg shrink-0">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Progress</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track your fitness journey</p>
          </div>
        </div>
        <Button onClick={() => setShowModal(true)} className="shrink-0">
          <Plus className="h-4 w-4" />
          Log Progress
        </Button>
      </div>

      {/* Summary Stats */}
      {latestLog && (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
          <Card>
            <CardContent className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Latest Weight</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {latestLog.weight != null ? `${latestLog.weight} kg` : "—"}
              </p>
              <div className="flex items-center gap-1">
                <TrendingIndicator current={latestLog.weight ?? 0} previous={getPreviousVal("weight")} improving="lower" />
                <span className="text-xs text-gray-400">vs last</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Starting Weight</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {firstLog?.weight != null ? `${firstLog.weight} kg` : "—"}
              </p>
              <p className="text-xs text-gray-400">
                {firstLog ? formatDate(firstLog.date) : ""}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Change</p>
              <p className={`text-2xl font-bold ${
                latestLog.weight != null && firstLog?.weight != null
                  ? latestLog.weight < firstLog.weight
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-600 dark:text-red-400"
                  : "text-gray-900 dark:text-gray-100"
              }`}>
                {latestLog.weight != null && firstLog?.weight != null
                  ? `${(latestLog.weight - firstLog.weight) > 0 ? "+" : ""}${(latestLog.weight - firstLog.weight).toFixed(1)} kg`
                  : "—"}
              </p>
              <div className="flex items-center gap-1">
                {latestLog.weight != null && firstLog?.weight != null && (
                  latestLog.weight < firstLog.weight
                    ? <TrendingDown className="h-4 w-4 text-emerald-500" />
                    : <TrendingUp className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs text-gray-400">overall</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-1">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Last Updated</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {latestLog ? formatDate(latestLog.date) : "—"}
              </p>
              <p className="text-xs text-gray-400">
                {latestLog ? `${sortedLogs.length} log${sortedLogs.length !== 1 ? "s" : ""} total` : ""}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {!data || (logs.length === 0 && photos.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="rounded-full bg-gray-100 p-6 dark:bg-gray-800">
            <Activity className="h-12 w-12 text-gray-300 dark:text-gray-600" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">No progress data yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            Start logging your measurements to see your progress over time.
          </p>
          <Button onClick={() => setShowModal(true)} className="mt-4">
            <Plus className="h-4 w-4" />
            Log Your First Measurement
          </Button>
        </div>
      ) : (
        <>
          {/* Body Measurements Grid */}
          <Card>
            <CardHeader title="Body Measurements" description="Your latest stats at a glance" />
            <CardContent>
              <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                {MEASUREMENT_FIELDS.map((field) => {
                  const current = getLatestVal(field.key)
                  const previous = getPreviousVal(field.key)
                  const prevNum = previous as number | null
                  return (
                    <div
                      key={field.key}
                      className="rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 p-4 transition-all duration-200 hover:shadow-sm hover:border-gray-200 dark:hover:border-gray-600"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="rounded-lg bg-indigo-500/10 p-2 dark:bg-indigo-400/10">
                          <field.icon className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        {current != null && previous != null && (
                          <TrendingIndicator
                            current={current as number}
                            previous={prevNum}
                            improving={field.improving}
                          />
                        )}
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {current != null ? current : "—"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {field.label} <span className="text-gray-400">({field.unit})</span>
                      </p>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Progress Chart */}
          {logs.filter((l) => l.weight != null).length >= 2 && (
            <Card>
              <CardHeader title="Weight Trend" description="Your weight over time" />
              <CardContent>
                <WeightChart logs={sortedLogs} />
              </CardContent>
            </Card>
          )}

          {/* Progress Photos */}
          <Card>
            <CardHeader
              title="Progress Photos"
              description="Track your transformation visually"
              action={
                <Button size="sm" variant="outline" onClick={() => setShowPhotoUpload(true)}>
                  <Camera className="h-4 w-4" />
                  Upload Photo
                </Button>
              }
            />
            <CardContent>
              {photos.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <Camera className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">No progress photos yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Upload photos to see your before/after transformation</p>
                  <Button size="sm" variant="outline" onClick={() => setShowPhotoUpload(true)} className="mt-3">
                    <Upload className="h-4 w-4" />
                    Upload First Photo
                  </Button>
                </div>
              ) : (
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                  {photos.map((photo) => (
                    <div key={photo.id} className="group relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 aspect-[3/4]">
                      <img
                        src={photo.url}
                        alt={`Progress photo ${photo.type}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <p className="text-xs text-white font-medium capitalize">{photo.type}</p>
                        <p className="text-[10px] text-white/70">{formatDate(photo.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* History Table */}
          <Card>
            <CardHeader title="Progress History" description="All your logged measurements" />
            <CardContent>
              {sortedLogs.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No logs recorded yet</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {sortedLogs.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-full bg-indigo-500/10 p-2 dark:bg-indigo-400/10">
                          <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDate(log.date)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            W: {log.weight ?? "—"} kg
                            {log.bodyFat != null && ` · BF: ${log.bodyFat}%`}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${selectedLog?.id === log.id ? "rotate-90" : ""}`} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Selected Log Details */}
          {selectedLog && (
            <Card>
              <CardHeader
                title={`Details - ${formatDate(selectedLog.date)}`}
                action={
                  <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                    Close
                  </Button>
                }
              />
              <CardContent>
                <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
                  {MEASUREMENT_FIELDS.map((field) => {
                    const val = selectedLog[field.key]
                    return (
                      <div key={field.key} className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{field.label}</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {val != null ? `${val} ${field.unit}` : "—"}
                        </p>
                      </div>
                    )
                  })}
                </div>
                {selectedLog.notes && (
                  <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 p-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                    <p className="text-sm text-gray-900 dark:text-gray-100">{selectedLog.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Log Progress Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Log Progress" description="Record your latest measurements">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 grid-cols-2">
            {MEASUREMENT_FIELDS.map((field) => (
              <Input
                key={field.key}
                id={field.key}
                label={`${field.label} (${field.unit})`}
                type="number"
                step="0.1"
                placeholder="—"
                value={form[field.key]}
                onChange={(e) => handleFormChange(field.key, e.target.value)}
                icon={<field.icon className="h-4 w-4" />}
              />
            ))}
          </div>
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              Notes
            </label>
            <textarea
              id="notes"
              rows={3}
              className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-600 dark:placeholder-gray-500 dark:focus:ring-indigo-400"
              placeholder="How was your workout today?"
              value={form.notes}
              onChange={(e) => handleFormChange("notes", e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              <Sparkles className="h-4 w-4" />
              Save Measurements
            </Button>
          </div>
        </form>
      </Modal>

      {/* Photo Upload Modal */}
      <Modal open={showPhotoUpload} onClose={() => setShowPhotoUpload(false)} title="Upload Progress Photo" description="Share your transformation">
        <div className="space-y-4">
          <div className="rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-8 text-center hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
              id="photoInput"
            />
            <label htmlFor="photoInput" className="cursor-pointer space-y-2">
              <div className="rounded-full bg-indigo-500/10 p-3 w-fit mx-auto dark:bg-indigo-400/10">
                <Upload className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Click to upload a photo</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG or WEBP (max 5MB)</p>
            </label>
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setShowPhotoUpload(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
