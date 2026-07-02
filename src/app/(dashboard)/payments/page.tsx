"use client"

import { useState, useEffect, useCallback } from "react"
import { IndianRupee, Search, Filter, Plus, ChevronLeft, ChevronRight, Receipt, Download, CreditCard, Banknote, Smartphone, Wallet, AlertCircle, ExternalLink } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { TableSkeleton } from "@/components/ui/skeleton"
import { formatDate, formatCurrency, getPlanLabel, getPlanAmount } from "@/lib/utils"

interface PaymentMember {
  id: string
  name: string
  phone: string
  email: string | null
}

interface PaymentMembership {
  id: string
  plan: string
  startDate: string
  endDate: string
  status?: string
}

interface Payment {
  id: string
  memberId: string
  membershipId: string | null
  amount: number
  method: string
  status: string
  transactionId: string | null
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  receiptNo: string | null
  notes: string | null
  date: string
  createdAt: string
  member: PaymentMember
  membership: PaymentMembership | null
}

interface PaymentsResponse {
  payments: Payment[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface PaymentSummary {
  monthlyRevenue: number
  totalPayments: number
  pendingPayments: number
}

interface ReceiptData {
  receiptNo: string
  paymentId: string
  amount: number
  method: string
  status: string
  date: string
  member: {
    id: string
    name: string
    phone: string
    email: string | null
    address: string | null
  }
  membership: {
    id: string
    plan: string
    startDate: string
    endDate: string
    status: string
  } | null
  razorpayPaymentId: string | null
  razorpayOrderId: string | null
}

interface MemberOption {
  id: string
  name: string
  phone: string
}

interface MemberMembership {
  id: string
  plan: string
  amount: number
  status: string
  startDate: string
  endDate: string
}

const methodOptions = [
  { value: "", label: "All Methods" },
  { value: "CASH", label: "Cash" },
  { value: "UPI", label: "UPI" },
  { value: "CARD", label: "Card" },
  { value: "ONLINE", label: "Online" },
]

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "PAID", label: "Paid" },
  { value: "PENDING", label: "Pending" },
  { value: "FAILED", label: "Failed" },
  { value: "REFUNDED", label: "Refunded" },
]

const methodConfig: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  CASH: { icon: Banknote, color: "text-semantic-success", bgColor: "bg-semantic-success/15", label: "Cash" },
  UPI: { icon: Smartphone, color: "text-primary", bgColor: "bg-primary/15", label: "UPI" },
  CARD: { icon: CreditCard, color: "text-primary", bgColor: "bg-primary/15", label: "Card" },
  ONLINE: { icon: Wallet, color: "text-ink-muted", bgColor: "bg-surface-2", label: "Online" },
}

function getMethodConfig(method: string) {
  return methodConfig[method] || { icon: CreditCard, color: "text-ink-muted", bgColor: "bg-surface-2", label: method }
}

function getSummaryIcon(key: string) {
  switch (key) {
    case "monthlyRevenue": return IndianRupee
    case "totalPayments": return Receipt
    case "pendingPayments": return AlertCircle
    default: return IndianRupee
  }
}

function getSummaryColor(key: string) {
  switch (key) {
    case "monthlyRevenue": return { bg: "bg-surface-2", icon: "text-ink" }
    case "totalPayments": return { bg: "bg-surface-2", icon: "text-ink" }
    case "pendingPayments": return { bg: "bg-surface-2", icon: "text-ink" }
    default: return { bg: "bg-surface-2", icon: "text-ink" }
  }
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<PaymentSummary | null>(null)

  const [search, setSearch] = useState("")
  const [methodFilter, setMethodFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)

  const [recordModalOpen, setRecordModalOpen] = useState(false)
  const [receiptModalOpen, setReceiptModalOpen] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptData | null>(null)
  const [receiptLoading, setReceiptLoading] = useState(false)

  const [members, setMembers] = useState<MemberOption[]>([])
  const [memberSearch, setMemberSearch] = useState("")
  const [selectedMemberId, setSelectedMemberId] = useState("")
  const [memberMemberships, setMemberMemberships] = useState<MemberMembership[]>([])
  const [selectedMembershipId, setSelectedMembershipId] = useState("")
  const [paymentAmount, setPaymentAmount] = useState("")
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])
  const [paymentNotes, setPaymentNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const [razorpayLoading, setRazorpayLoading] = useState(false)

  const filteredMembers = members.filter(
    (m) => (m.name ?? "").toLowerCase().includes(memberSearch.toLowerCase()) || m.phone.includes(memberSearch)
  )

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (methodFilter) params.set("method", methodFilter)
      if (statusFilter) params.set("status", statusFilter)
      if (fromDate) params.set("from", fromDate)
      if (toDate) params.set("to", toDate)
      params.set("page", String(page))
      params.set("limit", "10")

      const res = await fetch(`/api/payments?${params}`)
      if (!res.ok) throw new Error(res.status === 401 ? "Unauthorized" : "Failed to fetch payments")
      const data: PaymentsResponse = await res.json()
      setPayments(data.payments)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [search, methodFilter, statusFilter, fromDate, toDate, page])

  const fetchSummary = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard")
      if (res.ok) {
        const data = await res.json()
        setSummary({
          monthlyRevenue: data.metrics.monthlyRevenue.value,
          totalPayments: data.metrics.totalActiveMembers ? 0 : 0,
          pendingPayments: data.metrics.pendingPayments.value,
        })
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchPayments()
    fetchSummary()
  }, [])

  useEffect(() => {
    if (summary && total > 0) {
      setSummary((prev) => {
        if (prev && prev.totalPayments === total) return prev
        return prev ? { ...prev, totalPayments: total } : prev
      })
    }
  }, [total])

  const openRecordModal = async () => {
    setSelectedMemberId("")
    setMemberSearch("")
    setSelectedMembershipId("")
    setMemberMemberships([])
    setPaymentAmount("")
    setPaymentMethod("CASH")
    setPaymentDate(new Date().toISOString().split("T")[0])
    setPaymentNotes("")
    setFormError(null)
    setRecordModalOpen(true)

    try {
      const res = await fetch("/api/members?limit=100")
      if (res.ok) {
        const data = await res.json()
        setMembers((data.members ?? []).map((m: Record<string, unknown>) => ({ id: m.id, name: `${m.firstName ?? ""} ${m.lastName ?? ""}`.trim(), phone: m.phone })))
      }
    } catch {
      setMembers([])
    }
  }

  const handleMemberSelect = async (member: MemberOption) => {
    setSelectedMemberId(member.id)
    setMemberSearch(member.name)
    setSelectedMembershipId("")
    setPaymentAmount("")

    try {
      const res = await fetch(`/api/members/${member.id}/memberships`)
      if (res.ok) {
        const data = await res.json()
        if (data.memberships) {
          setMemberMemberships(data.memberships)
        }
      }
    } catch {
      setMemberMemberships([])
    }
  }

  const handleMembershipSelect = (membershipId: string) => {
    setSelectedMembershipId(membershipId)
    if (membershipId) {
      const membership = memberMemberships.find((m) => m.id === membershipId)
      if (membership) {
        setPaymentAmount(String(membership.amount))
      }
    } else {
      setPaymentAmount("")
    }
  }

  const handleRecordPayment = async () => {
    try {
      setSaving(true)
      setFormError(null)

      if (!selectedMemberId) {
        setFormError("Please select a member")
        return
      }

      if (!paymentAmount || Number(paymentAmount) <= 0) {
        setFormError("Please enter a valid amount")
        return
      }

      const body: Record<string, unknown> = {
        memberId: selectedMemberId,
        amount: Number(paymentAmount),
        method: paymentMethod,
        notes: paymentNotes || null,
      }

      if (selectedMembershipId) {
        body.membershipId = selectedMembershipId
      }

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to record payment")
      }

      setRecordModalOpen(false)
      fetchPayments()
      fetchSummary()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const viewReceipt = (paymentId: string) => {
    const payment = payments.find((p) => p.id === paymentId)
    if (!payment) return
    setSelectedReceipt({
      receiptNo: payment.receiptNo || payment.id.slice(0, 8).toUpperCase(),
      paymentId: payment.id,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      date: payment.createdAt,
      member: {
        id: payment.member.id,
        name: payment.member.name,
        phone: payment.member.phone,
        email: payment.member.email,
        address: payment.member.email,
      },
      membership: payment.membership
        ? {
            id: payment.membership.id,
            plan: payment.membership.plan,
            startDate: payment.membership.startDate,
            endDate: payment.membership.endDate,
            status: payment.membership.status || "ACTIVE",
          }
        : null,
      razorpayPaymentId: payment.razorpayPaymentId,
      razorpayOrderId: payment.razorpayOrderId,
    })
    setReceiptModalOpen(true)
  }

  const handleDownloadReceipt = async (paymentId: string) => {
    try {
      const res = await fetch(`/api/payments/${paymentId}/receipt`)
      if (!res.ok) throw new Error("Download failed")
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const disposition = res.headers.get("Content-Disposition") || ""
      const match = disposition.match(/filename="(.+?)"/)
      const filename = match ? match[1] : `receipt-${paymentId}.pdf`
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      setTimeout(() => URL.revokeObjectURL(url), 100)
    } catch (err) {
      console.error("Download receipt error:", err)
    }
  }

  const printReceipt = () => {
    window.print()
  }

  const handleRazorpayPayment = async () => {
    try {
      setRazorpayLoading(true)
      setFormError(null)

      if (!selectedMemberId) {
        setFormError("Please select a member")
        return
      }

      if (!paymentAmount || Number(paymentAmount) <= 0) {
        setFormError("Please enter a valid amount")
        return
      }

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: selectedMemberId,
          membershipId: selectedMembershipId || null,
          amount: Number(paymentAmount),
          method: "ONLINE",
          status: "PENDING",
          notes: paymentNotes || null,
        }),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to create payment")
      }

      const { payment } = await res.json()

      const orderRes = await fetch("/api/payments/razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: Number(paymentAmount),
          paymentId: payment.id,
          memberId: selectedMemberId,
        }),
      })

      if (!orderRes.ok) {
        throw new Error("Failed to create Razorpay order")
      }

      const orderData = await orderRes.json()

      const razorpayKeyRes = await fetch("/api/settings")
      let razorpayKeyId = ""
      if (razorpayKeyRes.ok) {
        const settings = await razorpayKeyRes.json()
        razorpayKeyId = settings.razorpayKeyId
      }

      if (!razorpayKeyId) {
        throw new Error("Razorpay is not configured")
      }

      const options = {
        key: razorpayKeyId,
        amount: orderData.amount,
        currency: "INR",
        name: "GymFlow",
        description: `Payment for ${memberSearch}`,
        order_id: orderData.id,
        handler: function (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) {
          fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          })
            .then((verifyRes) => {
              if (verifyRes.ok) {
                setRecordModalOpen(false)
                fetchPayments()
                fetchSummary()
              }
            })
            .catch(() => {})
        },
        prefill: {
          contact: members.find((m) => m.id === selectedMemberId)?.phone || "",
        },
        theme: {
          color: "#5e6ad2",
        },
        modal: {
          ondismiss: function () {
            setRazorpayLoading(false)
          },
        },
      }

      const RazorpayConstructor = (window as unknown as Record<string, unknown>).Razorpay as new (options: Record<string, unknown>) => { open: () => void }
      const razorpay = new RazorpayConstructor(options)
      razorpay.open()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Razorpay payment failed")
    } finally {
      setRazorpayLoading(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handleMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setMethodFilter(e.target.value)
    setPage(1)
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
    setPage(1)
  }

  const summaryCards = [
    { key: "monthlyRevenue", label: "Monthly Revenue", value: summary ? formatCurrency(summary.monthlyRevenue) : "₹0" },
    { key: "totalPayments", label: "Total Payments", value: summary ? String(summary.totalPayments) : "0" },
    { key: "pendingPayments", label: "Pending Payments", value: summary ? String(summary.pendingPayments) : "0" },
  ]

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-10rem)]">
        <div className="text-center max-w-md px-4">
          <div className="mx-auto flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-full bg-semantic-error/10">
            <AlertCircle className="h-8 sm:h-10 w-8 sm:w-10 text-semantic-error" />
          </div>
          <h2 className="mt-4 text-base sm:text-lg font-semibold text-ink">Failed to load payments</h2>
          <p className="mt-2 text-xs sm:text-sm text-ink-muted">{error}</p>
          <Button onClick={() => { fetchPayments(); fetchSummary() }} className="mt-6 w-full sm:w-auto">
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-ink-primary text-balance">Payments</h1>
          <p className="text-xs sm:text-sm text-ink-subtle mt-2">Manage payments and generate receipts</p>
        </div>
        <Button onClick={openRecordModal} className="w-full sm:w-auto">
          <Plus className="h-5 w-5" />
          Record Payment
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map(({ key, label, value }) => {
          const Icon = getSummaryIcon(key)
          const colors = getSummaryColor(key)
          return (
            <Card key={key} interactive variant="elevated">
              <CardContent className="p-4 sm:p-5 md:p-6">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className={`rounded-lg p-2.5 sm:p-3 ${colors.bg}`}>
                    <Icon className={`h-4.5 w-4.5 sm:h-5 sm:w-5 ${colors.icon}`} />
                  </div>
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-bold text-ink-primary text-balance">{value}</p>
                  <p className="mt-2 text-xs sm:text-sm text-ink-tertiary font-medium">{label}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search by member name..."
                value={search}
                onChange={handleSearchChange}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="w-full sm:w-40">
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
                placeholder="From"
              />
            </div>
            <div className="w-full sm:w-40">
              <Input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1) }}
                placeholder="To"
              />
            </div>
            <div className="w-full sm:w-36">
              <Select
                options={methodOptions}
                value={methodFilter}
                onChange={handleMethodChange}
              />
            </div>
            <div className="w-full sm:w-36">
              <Select
                options={statusOptions}
                value={statusFilter}
                onChange={handleStatusChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardHeader title="Payments" description="Loading..." />
          <CardContent>
            <TableSkeleton rows={5} />
          </CardContent>
        </Card>
      ) : payments.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-2">
                <Receipt className="h-8 w-8 text-ink-tertiary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">No payments found</h3>
              <p className="mt-2 text-sm text-ink-muted max-w-sm">
                {search || methodFilter || statusFilter || fromDate || toDate
                  ? "No payments match your search criteria. Try adjusting your filters."
                  : "No payments have been recorded yet."}
              </p>
              {!search && !methodFilter && !statusFilter && !fromDate && !toDate && (
                <Button onClick={openRecordModal} className="mt-4">
                  <Plus className="h-4 w-4" />
                  Record Payment
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hairline">
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Receipt No</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Member Name</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Method</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Date</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {payments.map((payment) => {
                      const method = getMethodConfig(payment.method)
                      const MethodIcon = method.icon
                      return (
                        <tr
                          key={payment.id}
                          className="border-b border-hairline/50 hover:bg-surface-2/50 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="font-mono text-xs font-medium text-ink">
                              {payment.receiptNo || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-ink">
                                {payment.member.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-ink">
                                {payment.member.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-ink">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={`rounded-full p-1.5 ${method.bgColor}`}>
                                <MethodIcon className={`h-3.5 w-3.5 ${method.color}`} />
                              </div>
                              <span className="text-sm text-ink-muted">{method.label}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <Badge status={payment.status}>{payment.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-sm text-ink-muted">
                            {formatDate(payment.date || payment.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => viewReceipt(payment.id)}
                              >
                                <Receipt className="h-4 w-4" />
                                View
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownloadReceipt(payment.id)}
                                title="Download PDF Receipt"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-ink-muted">
                Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total} payments
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setPage(p)}
                    className="min-w-[36px]"
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        open={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        title="Record Payment"
        description="Record a manual payment or accept online payment"
        size="lg"
      >
        <div className="space-y-6">
          {formError && (
            <div className="flex items-center gap-2 rounded-lg bg-semantic-error/10 border border-semantic-error/20 p-3 text-sm text-semantic-error">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Member</label>
            <Input
              placeholder="Search members..."
              value={memberSearch}
              onChange={(e) => {
                setMemberSearch(e.target.value)
                setSelectedMemberId("")
                setSelectedMembershipId("")
                setMemberMemberships([])
                setPaymentAmount("")
              }}
              icon={<Search className="h-4 w-4" />}
            />
            {memberSearch && filteredMembers.length > 0 && (
              <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-hairline divide-y divide-hairline">
                {filteredMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                      className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-surface-2 ${
                      selectedMemberId === m.id
                        ? "bg-surface-2 text-ink"
                        : "text-ink"
                    }`}
                    onClick={() => handleMemberSelect(m)}
                  >
                    <span className="font-medium">{m.name}</span>
                    <span className="text-ink-muted ml-2">{m.phone}</span>
                  </button>
                ))}
              </div>
            )}
            {memberSearch && filteredMembers.length === 0 && (
              <p className="mt-2 text-sm text-ink-muted">No members found</p>
            )}
          </div>

          {memberMemberships.length > 0 && (
            <Select
              label="Membership (optional)"
              options={[
                { value: "", label: "No membership" },
                ...memberMemberships.map((m) => ({
                  value: m.id,
                  label: `${getPlanLabel(m.plan)} - ${formatCurrency(m.amount)}`,
                })),
              ]}
              value={selectedMembershipId}
              onChange={(e) => handleMembershipSelect(e.target.value)}
              placeholder="Select membership"
            />
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Amount (₹)"
              type="number"
              min="1"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Enter amount"
            />
            <Select
              label="Payment Method"
              options={[
                { value: "CASH", label: "Cash" },
                { value: "UPI", label: "UPI" },
                { value: "CARD", label: "Card" },
              ]}
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Notes</label>
              <Input
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
            <Button variant="secondary" onClick={() => setRecordModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleRazorpayPayment}
              loading={razorpayLoading}
            >
              <Wallet className="h-4 w-4" />
              Pay with Razorpay
            </Button>
            <Button onClick={handleRecordPayment} loading={saving}>
              <IndianRupee className="h-4 w-4" />
              Record Payment
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={receiptModalOpen}
        onClose={() => { setReceiptModalOpen(false); setSelectedReceipt(null) }}
        title="Payment Receipt"
        description="View full receipt details"
        size="md"
      >
        {receiptLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : selectedReceipt ? (
          <div className="space-y-6" id="receipt-content">
            <div className="text-center border-b border-hairline pb-4">
              <h3 className="text-lg font-bold text-ink">GymFlow</h3>
              <p className="text-xs text-ink-muted mt-0.5">Payment Receipt</p>
              <p className="text-xs text-ink-muted">Receipt No: {selectedReceipt.receiptNo}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-ink-muted text-xs">Member</p>
                <p className="font-medium text-ink">{selectedReceipt.member.name}</p>
                <p className="text-ink-muted">{selectedReceipt.member.phone}</p>
                {selectedReceipt.member.email && (
                  <p className="text-ink-muted">{selectedReceipt.member.email}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-ink-muted text-xs">Date</p>
                <p className="font-medium text-ink">{formatDate(selectedReceipt.date)}</p>
                <p className="text-ink-muted text-xs mt-2">Status</p>
                <Badge status={selectedReceipt.status}>{selectedReceipt.status}</Badge>
              </div>
            </div>

            <div className="rounded-lg border border-hairline divide-y divide-hairline">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-ink-muted">Amount</span>
                <span className="text-lg font-bold text-ink">
                  {formatCurrency(selectedReceipt.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-ink-muted">Payment Method</span>
                <span className="text-sm font-medium text-ink">
                  {getMethodConfig(selectedReceipt.method).label}
                </span>
              </div>
              {selectedReceipt.membership && (
                <>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-ink-muted">Plan</span>
                    <span className="text-sm font-medium text-ink">
                      {getPlanLabel(selectedReceipt.membership.plan)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm text-ink-muted">Plan Period</span>
                    <span className="text-sm font-medium text-ink">
                      {formatDate(selectedReceipt.membership.startDate)} - {formatDate(selectedReceipt.membership.endDate)}
                    </span>
                  </div>
                </>
              )}
              {selectedReceipt.razorpayPaymentId && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-ink-muted">Transaction ID</span>
                  <span className="text-xs font-mono font-medium text-ink">
                    {selectedReceipt.razorpayPaymentId}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
              <Button variant="secondary" size="sm" onClick={printReceipt}>
                <Download className="h-4 w-4" />
                Print
              </Button>
              <Button size="sm" onClick={() => { setReceiptModalOpen(false); setSelectedReceipt(null) }}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-ink-muted">
            Receipt data not available
          </div>
        )}
      </Modal>
    </div>
  )
}
