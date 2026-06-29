"use client"
import { useState, useEffect } from "react"
import { CreditCard, Shield, Calendar, IndianRupee, ChevronRight, Download, QrCode, CheckCircle, AlertTriangle, Clock, Zap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { formatDate, formatCurrency, getDaysRemaining, getPlanLabel, getPlanAmount } from "@/lib/utils"
import { loadRazorpayScript } from "@/lib/razorpay"

interface Membership {
  id: string
  plan: string
  startDate: string
  endDate: string
  status: string
  amount?: number
}

interface PaymentRecord {
  id: string
  receiptNo: string
  amount: number
  method: string
  status: string
  date: string
  razorpayPaymentId?: string
  membership?: { plan: string }
}

interface DashboardResponse {
  member: { firstName: string; lastName: string; status: string }
  activeMembership: { plan: string; startDate: string; endDate: string } | null
  currentMembership: { plan: string; startDate: string; endDate: string; daysRemaining: number } | null
}

interface PaymentsResponse {
  payments: PaymentRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const PLAN_OPTIONS = [
  { value: "MONTHLY", label: "Monthly - ₹999" },
  { value: "QUARTERLY", label: "Quarterly - ₹2,499" },
  { value: "HALF_YEARLY", label: "Half Yearly - ₹4,499" },
  { value: "YEARLY", label: "Yearly - ₹7,999" },
]

function SkeletonMembershipPage() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-64 rounded-xl bg-gray-200 dark:bg-gray-700" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-gray-200 dark:bg-gray-700 p-6 h-24" />
        ))}
      </div>
      <div className="rounded-xl bg-gray-200 dark:bg-gray-700 p-6 h-48" />
    </div>
  )
}

function getDaysColor(days: number): string {
  if (days > 30) return "text-emerald-600 dark:text-emerald-400"
  if (days >= 7) return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

function getDaysBgColor(days: number): string {
  if (days > 30) return "bg-emerald-500/10"
  if (days >= 7) return "bg-amber-500/10"
  return "bg-red-500/10"
}

export default function MemberMembership() {
  const [membership, setMembership] = useState<Membership | null>(null)
  const [memberName, setMemberName] = useState("")
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState("MONTHLY")
  const [renewing, setRenewing] = useState(false)
  const [showRenewal, setShowRenewal] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const [dashboardRes, paymentsRes] = await Promise.all([
        fetch("/api/member/dashboard"),
        fetch("/api/member/payments?page=1&limit=50"),
      ])

      if (!dashboardRes.ok) throw new Error("Failed to load membership data")

      const dashboardData: DashboardResponse = await dashboardRes.json()
      setMemberName(`${dashboardData.member.firstName} ${dashboardData.member.lastName}`)

      const activeMem = dashboardData.activeMembership || dashboardData.currentMembership
      if (activeMem) {
        setMembership({
          id: "",
          plan: activeMem.plan,
          startDate: activeMem.startDate,
          endDate: activeMem.endDate,
          status: "ACTIVE",
        })
      }

      if (paymentsRes.ok) {
        const paymentsData: PaymentsResponse = await paymentsRes.json()
        setPaymentHistory(paymentsData.payments || [])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const daysRemaining = membership ? getDaysRemaining(new Date(membership.endDate)) : 0
  const memberId = `GF-${String(Math.abs(memberName.split(" ").join("").split("").reduce((a, c) => a + c.charCodeAt(0), 0)).toString().slice(0, 6)).padStart(6, "0")}`
  const needsRenewal = !membership || daysRemaining <= 30
  const renewalAmount = getPlanAmount(selectedPlan)

  async function handleRenew() {
    setRenewing(true)
    try {
      const res = await fetch("/api/member/payments/renew", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Renewal failed")
      }

      const data = await res.json()

      const scriptLoaded = await loadRazorpayScript()
      if (scriptLoaded) {
        const options = {
          key: data.razorpayKeyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
          amount: data.amount * 100,
          currency: "INR",
          name: "GymFlow",
          description: `${getPlanLabel(data.plan)} Renewal`,
          order_id: data.orderId,
          prefill: { name: memberName },
          handler: function () {
            fetchData()
            setShowRenewal(false)
          },
          modal: {
            ondismiss: function () {
              setRenewing(false)
            },
          },
        }
        const rzp = new window.Razorpay!(options)
        rzp.open()
      } else {
        alert(`Razorpay is unavailable right now. Order created: ${data.orderId}, Amount: ${formatCurrency(data.amount)}`)
        fetchData()
        setShowRenewal(false)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Renewal failed")
    } finally {
      setRenewing(false)
    }
  }

  if (loading) return <SkeletonMembershipPage />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
        <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load membership</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <Button onClick={fetchData} className="mt-4">Try Again</Button>
      </div>
    )
  }

  const historyItems = paymentHistory.filter((p) => p.status === "PAID")

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Membership</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your gym membership and renewals</p>
        </div>
      </div>

      {/* Digital Membership Card */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-800 p-6 sm:p-8 text-white shadow-xl">
        {/* Watermark */}
        <div className="absolute top-0 right-0 w-48 h-48 translate-x-12 -translate-y-12 opacity-5">
          <DumbbellIcon className="w-full h-full" />
        </div>
        <div className="absolute bottom-0 left-0 w-64 h-64 -translate-x-16 translate-y-16 opacity-5">
          <DumbbellIcon className="w-full h-full" />
        </div>

        {/* Card Header */}
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest opacity-70">GymFlow</p>
            <p className="mt-1 text-lg font-semibold">{memberName || "Member"}</p>
            <p className="mt-0.5 text-xs opacity-70">ID: {memberId}</p>
          </div>
          {membership && (
            <Badge status={membership.status} className="bg-white/20 text-white backdrop-blur-sm border-0">
              {membership.status}
            </Badge>
          )}
        </div>

        {/* Card Body */}
        <div className="relative z-10 mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-70">Plan</p>
            <p className="mt-1 text-xl font-bold">
              {membership ? getPlanLabel(membership.plan) : "No Active Plan"}
            </p>
          </div>
          <div className="text-right sm:text-left">
            <p className="text-xs font-medium uppercase tracking-wider opacity-70">Status</p>
            <p className="mt-1">
              {membership ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-3 py-0.5 text-sm font-medium backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-red-400/20 px-3 py-0.5 text-sm font-medium backdrop-blur-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  Inactive
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Dates */}
        {membership && (
          <div className="relative z-10 mt-4 grid gap-2 sm:grid-cols-2 text-sm">
            <div>
              <span className="opacity-70">Valid from: </span>
              <span className="font-medium">{formatDate(new Date(membership.startDate))}</span>
            </div>
            <div className="sm:text-right">
              <span className="opacity-70">Valid until: </span>
              <span className="font-medium">{formatDate(new Date(membership.endDate))}</span>
            </div>
          </div>
        )}

        {/* Days Remaining & QR Placeholder */}
        <div className="relative z-10 mt-6 flex items-end justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider opacity-70">Days Remaining</p>
            <p className={`text-4xl font-bold ${membership ? "text-white" : "text-red-300"}`}>
              {membership ? daysRemaining : 0}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="rounded-lg bg-white p-2">
              <div className="grid grid-cols-5 gap-0.5">
                {Array.from({ length: 25 }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-sm ${
                      i < 10 ? "bg-indigo-600" : "bg-indigo-200"
                    }`}
                  />
                ))}
              </div>
            </div>
            <span className="text-[10px] opacity-70">Scan to verify</span>
          </div>
        </div>
      </div>

      {/* Membership Details */}
      <Card>
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Membership Details</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Current Plan</p>
            <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
              {membership ? getPlanLabel(membership.plan) : "None"}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Start Date</p>
            <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
              {membership ? formatDate(new Date(membership.startDate)) : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">End Date</p>
            <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
              {membership ? formatDate(new Date(membership.endDate)) : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Days Remaining</p>
            <p className={`mt-1 text-base font-semibold ${membership ? getDaysColor(daysRemaining) : "text-gray-400"}`}>
              {membership ? `${daysRemaining} days` : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount Paid</p>
            <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">
              {membership ? formatCurrency(getPlanAmount(membership.plan)) : "—"}
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</p>
            <div className="mt-1">
              {membership ? (
                <Badge status={membership.status}>{membership.status}</Badge>
              ) : (
                <Badge status="EXPIRED">INACTIVE</Badge>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Renewal Section */}
      {needsRenewal && (
        <Card className="border-amber-200 dark:border-amber-800">
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${getDaysBgColor(daysRemaining)}`}>
              {daysRemaining > 0 ? (
                <Clock className={`h-5 w-5 ${getDaysColor(daysRemaining)}`} />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {daysRemaining > 0 ? "Renew Your Membership" : "Membership Expired"}
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {daysRemaining > 0
                  ? `Your membership expires in ${daysRemaining} days. Renew now to avoid interruption.`
                  : "Your membership has expired. Choose a plan to continue your fitness journey."}
              </p>

              {!showRenewal ? (
                <Button onClick={() => setShowRenewal(true)} className="mt-4">
                  <Zap className="h-4 w-4 mr-2" />
                  {daysRemaining > 0 ? "Renew Now" : "Get New Plan"}
                </Button>
              ) : (
                <div className="mt-4 space-y-4 rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
                  <Select
                    label="Select Plan"
                    value={selectedPlan}
                    onChange={(e) => setSelectedPlan(e.target.value)}
                    options={PLAN_OPTIONS}
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Amount to pay:</span>
                    <span className="text-xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(renewalAmount)}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => setShowRenewal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleRenew}
                      loading={renewing}
                      className="flex-1"
                    >
                      {renewing ? "Processing..." : "Proceed to Payment"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Membership History */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Membership History</h2>
          </div>
        </div>

        {historyItems.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <CreditCard className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No membership history found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-3 pr-4 text-left font-medium text-gray-500 dark:text-gray-400">Plan</th>
                  <th className="py-3 pr-4 text-left font-medium text-gray-500 dark:text-gray-400">Start Date</th>
                  <th className="py-3 pr-4 text-left font-medium text-gray-500 dark:text-gray-400">End Date</th>
                  <th className="py-3 pr-4 text-right font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th className="py-3 text-right font-medium text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody>
                {historyItems.map((payment) => (
                  <tr
                    key={payment.id}
                    className="border-b border-gray-100 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-3 pr-4 text-gray-900 dark:text-gray-100">
                      {payment.membership?.plan ? getPlanLabel(payment.membership.plan) : "—"}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                      {formatDate(new Date(payment.date))}
                    </td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">
                      {payment.membership?.plan
                        ? (() => {
                            const d = new Date(payment.date)
                            d.setMonth(d.getMonth() + 1)
                            return formatDate(d)
                          })()
                        : "—"}
                    </td>
                    <td className="py-3 pr-4 text-right font-medium text-gray-900 dark:text-gray-100">
                      {formatCurrency(payment.amount)}
                    </td>
                    <td className="py-3 text-right">
                      <Badge status={payment.status}>{payment.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

function DumbbellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.57 14.86L22 13.43L20.57 12L17 15.57L8.43 7L12 3.43L10.57 2L9.14 3.43L7.71 2L5.57 4.14L4.14 2.71L2.71 4.14L4.14 5.57L2 7.71L3.43 9.14L2 10.57L3.43 12L7 8.43L15.57 17L12 20.57L13.43 22L14.86 20.57L16.29 22L18.43 19.86L19.86 21.29L21.29 19.86L19.86 18.43L22 16.29L20.57 14.86Z" />
    </svg>
  )
}
