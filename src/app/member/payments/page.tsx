"use client"
import { useState, useEffect } from "react"
import { IndianRupee, Wallet, Download, CreditCard, Banknote, Smartphone, Globe, ChevronRight, AlertTriangle, Loader2, CheckCircle, XCircle, Clock, Receipt } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { formatDate, formatCurrency, getDaysRemaining, getPlanLabel, getPlanAmount, getStatusColor } from "@/lib/utils"
import { loadRazorpayScript } from "@/lib/razorpay"

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

interface MembershipInfo {
  plan: string
  startDate: string
  endDate: string
  daysRemaining: number
}

interface DashboardData {
  member: { firstName: string; lastName: string }
  currentMembership: MembershipInfo | null
  activeMembership: MembershipInfo | null
}

interface PaymentsResponse {
  payments: PaymentRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface RenewResponse {
  orderId: string
  amount: number
  plan: string
  razorpayKeyId?: string
}

const PLAN_OPTIONS = [
  { value: "MONTHLY", label: "Monthly - \u20B9999" },
  { value: "QUARTERLY", label: "Quarterly - \u20B92,499" },
  { value: "HALF_YEARLY", label: "Half Yearly - \u20B94,499" },
  { value: "YEARLY", label: "Yearly - \u20B97,999" },
]

function getMethodIcon(method: string) {
  switch (method?.toUpperCase()) {
    case "CASH": return Banknote
    case "UPI": return Smartphone
    case "CARD": return CreditCard
    case "ONLINE": return Globe
    default: return Wallet
  }
}

function getMethodLabel(method: string): string {
  switch (method?.toUpperCase()) {
    case "CASH": return "Cash"
    case "UPI": return "UPI"
    case "CARD": return "Card"
    case "ONLINE": return "Online"
    default: return method || "—"
  }
}

function PaymentSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="h-8 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-3 w-36 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="h-6 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="mt-3 h-9 w-36 bg-gray-200 dark:bg-gray-700 rounded-lg" />
    </div>
  )
}

export default function MemberPayments() {
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [totalPayments, setTotalPayments] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [membership, setMembership] = useState<MembershipInfo | null>(null)
  const [memberName, setMemberName] = useState("")
  const [showRenewal, setShowRenewal] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState("MONTHLY")
  const [renewing, setRenewing] = useState(false)
  const [renewError, setRenewError] = useState<string | null>(null)

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

      if (!dashboardRes.ok) throw new Error("Failed to load data")

      const dashboardData: DashboardData = await dashboardRes.json()
      setMemberName(`${dashboardData.member.firstName} ${dashboardData.member.lastName}`)
      const mem = dashboardData.currentMembership || dashboardData.activeMembership
      if (mem) setMembership(mem)

      if (paymentsRes.ok) {
        const paymentsData: PaymentsResponse = await paymentsRes.json()
        setPayments(paymentsData.payments || [])
        setTotalPayments(paymentsData.total)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const daysRemaining = membership ? getDaysRemaining(new Date(membership.endDate)) : 0
  const needsRenewal = !membership || daysRemaining <= 30
  const isExpired = !membership || daysRemaining === 0
  const totalAmountSpent = payments
    .filter((p) => p.status === "PAID")
    .reduce((sum, p) => sum + p.amount, 0)
  const paidPayments = payments.filter((p) => p.status === "PAID")
  const lastPaymentDate = paidPayments.length > 0 ? paidPayments[0].date : null
  const renewalAmount = getPlanAmount(selectedPlan)

  async function handleRenew() {
    setRenewing(true)
    setRenewError(null)
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

      const data: RenewResponse = await res.json()

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
      setRenewError(err instanceof Error ? err.message : "Renewal failed")
    } finally {
      setRenewing(false)
    }
  }

  async function handleDownloadReceipt(paymentId: string) {
    try {
      const res = await fetch(`/api/payments/${paymentId}/receipt`)
      if (!res.ok) throw new Error("Failed to download receipt")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = window.document.createElement("a")
      a.href = url
      a.download = `receipt-${paymentId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // fallback: open in new tab
      window.open(`/api/payments/${paymentId}/receipt`, "_blank")
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case "PAID": return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case "FAILED": return <XCircle className="h-4 w-4 text-red-500" />
      case "PENDING": return <Clock className="h-4 w-4 text-amber-500" />
      default: return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in">
        <div className="animate-pulse space-y-2">
          <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="h-4 w-64 bg-gray-200 dark:bg-gray-700 rounded" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl bg-gray-200 dark:bg-gray-700 p-6 h-24 animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <PaymentSkeleton key={i} />)}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
        <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load payments</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <Button onClick={fetchData} className="mt-4">Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Payment History</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Track your payments and renew your membership</p>
        </div>
        <div className="rounded-xl bg-indigo-500/10 p-3 dark:bg-indigo-400/10">
          <Wallet className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200/50 bg-white p-5 shadow-sm dark:border-gray-700/50 dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Payments</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{totalPayments}</p>
        </div>
        <div className="rounded-xl border border-gray-200/50 bg-white p-5 shadow-sm dark:border-gray-700/50 dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Spent</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(totalAmountSpent)}</p>
        </div>
        <div className="rounded-xl border border-gray-200/50 bg-white p-5 shadow-sm dark:border-gray-700/50 dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Payment</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">
            {lastPaymentDate ? formatDate(new Date(lastPaymentDate)) : "—"}
          </p>
        </div>
      </div>

      {/* Quick Renew Section */}
      {needsRenewal && (
        <div className={`rounded-xl border p-5 shadow-sm ${
          isExpired
            ? "border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30"
            : "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30"
        }`}>
          <div className="flex items-start gap-3">
            <div className={`rounded-full p-2 ${
              isExpired ? "bg-red-500/10" : "bg-amber-500/10"
            }`}>
              {isExpired
                ? <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
                : <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              }
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {isExpired ? "Membership Expired" : "Membership Expiring Soon"}
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {isExpired
                  ? "Your membership has expired. Renew now to continue your fitness journey."
                  : `Your membership expires on ${membership ? formatDate(new Date(membership.endDate)) : "—"} (${daysRemaining} days remaining).`
                }
              </p>
              <Button
                onClick={() => setShowRenewal(true)}
                className="mt-3"
                size="sm"
              >
                <IndianRupee className="h-4 w-4 mr-1" />
                Renew Now
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment List */}
      {payments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-16 dark:border-gray-700 dark:bg-gray-900">
          <Wallet className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">No payments yet</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your payment history will appear here once you make your first payment.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => {
            const MethodIcon = getMethodIcon(payment.method)
            return (
              <div
                key={payment.id}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="font-mono text-xs text-gray-400 dark:text-gray-500">
                      #{payment.receiptNo}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(payment.status)}
                    <Badge status={payment.status}>{payment.status}</Badge>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <MethodIcon className="h-4 w-4" />
                    <span>{getMethodLabel(payment.method)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(new Date(payment.date))}</span>
                  </div>
                  {payment.razorpayPaymentId && (
                    <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-500">
                      <Receipt className="h-4 w-4" />
                      <span className="font-mono text-xs">{payment.razorpayPaymentId}</span>
                    </div>
                  )}
                  {payment.membership?.plan && (
                    <Badge status="ACTIVE" className="text-xs">
                      {getPlanLabel(payment.membership.plan)}
                    </Badge>
                  )}
                </div>

                <div className="mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownloadReceipt(payment.id)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download Receipt
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Renewal Modal */}
      <Modal
        open={showRenewal}
        onClose={() => { setShowRenewal(false); setRenewError(null) }}
        title={isExpired ? "Reactivate Membership" : "Renew Membership"}
        description="Choose a plan to continue your fitness journey."
        size="sm"
      >
        <div className="space-y-4">
          <Select
            label="Select Plan"
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            options={PLAN_OPTIONS}
          />

          <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Plan Amount</span>
              <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {formatCurrency(renewalAmount)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">GST (18%)</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {formatCurrency(Math.round(renewalAmount * 0.18))}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-2 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Total</span>
              <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(renewalAmount + Math.round(renewalAmount * 0.18))}
              </span>
            </div>
          </div>

          {renewError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
              {renewError}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={() => { setShowRenewal(false); setRenewError(null) }}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleRenew}
              loading={renewing}
            >
              {renewing ? (
                <>Processing...</>
              ) : (
                <>Pay with Razorpay</>
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
