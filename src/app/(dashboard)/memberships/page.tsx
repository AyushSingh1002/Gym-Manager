"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { CreditCard, Search, Filter, Plus, ChevronLeft, ChevronRight, ExternalLink, AlertCircle } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { TableSkeleton } from "@/components/ui/skeleton"
import { formatDate, formatCurrency, getPlanLabel, getDaysRemaining, getPlanAmount, calculateEndDate } from "@/lib/utils"

interface MembershipMember {
  id: string
  name: string
  phone: string
  email: string | null
}

interface Membership {
  id: string
  memberId: string
  plan: string
  startDate: string
  endDate: string
  status: string
  amount: number
  discount: number
  totalAmount: number
  paymentStatus: string
  notes: string | null
  member: MembershipMember
}

interface MembershipsResponse {
  memberships: Membership[]
  total: number
  page: number
  limit: number
  totalPages: number
}

interface MemberOption {
  id: string
  name: string
  phone: string
}

const planOptions = [
  { value: "", label: "All Plans" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "HALF_YEARLY", label: "Half Yearly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "CUSTOM", label: "Custom" },
]

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRED", label: "Expired" },
  { value: "PENDING", label: "Pending" },
  { value: "CANCELLED", label: "Cancelled" },
]

const assignPlanOptions = [
  { value: "MONTHLY", label: "Monthly - ₹999" },
  { value: "QUARTERLY", label: "Quarterly - ₹2,499" },
  { value: "HALF_YEARLY", label: "Half Yearly - ₹4,499" },
  { value: "YEARLY", label: "Yearly - ₹7,999" },
  { value: "CUSTOM", label: "Custom" },
]

function getDaysColor(days: number): string {
  if (days > 30) return "text-semantic-success"
  if (days >= 7) return "text-ink-muted"
  return "text-semantic-error"
}

export default function MembershipsPage() {
  const router = useRouter()
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [planFilter, setPlanFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [assignModalOpen, setAssignModalOpen] = useState(false)

  const [members, setMembers] = useState<MemberOption[]>([])
  const [memberSearch, setMemberSearch] = useState("")
  const [selectedMemberId, setSelectedMemberId] = useState("")
  const [assignPlan, setAssignPlan] = useState("MONTHLY")
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0])
  const [discount, setDiscount] = useState("0")
  const [notes, setNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const filteredMembers = members.filter(
    (m) =>
      (m.name ?? "").toLowerCase().includes(memberSearch.toLowerCase()) ||
      m.phone.includes(memberSearch)
  )

  const calculatedAmount = assignPlan === "CUSTOM" ? 0 : Math.max(0, getPlanAmount(assignPlan) - Number(discount || 0))

  const fetchMemberships = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (planFilter) params.set("plan", planFilter)
      if (statusFilter) params.set("status", statusFilter)
      params.set("page", String(page))
      params.set("limit", "10")

      const res = await fetch(`/api/memberships?${params}`)
      if (!res.ok) throw new Error(res.status === 401 ? "Unauthorized" : "Failed to fetch memberships")
      const data: MembershipsResponse = await res.json()
      setMemberships(data.memberships)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [search, planFilter, statusFilter, page])

  useEffect(() => {
    fetchMemberships()
  }, [fetchMemberships])

  const openAssignModal = async () => {
    setSelectedMemberId("")
    setMemberSearch("")
    setAssignPlan("MONTHLY")
    setStartDate(new Date().toISOString().split("T")[0])
    setDiscount("0")
    setNotes("")
    setFormError(null)
    setAssignModalOpen(true)

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

  const handleAssign = async () => {
    try {
      setSaving(true)
      setFormError(null)

      if (!selectedMemberId) {
        setFormError("Please select a member")
        return
      }

      if (!assignPlan) {
        setFormError("Please select a plan")
        return
      }

      const body = {
        memberId: selectedMemberId,
        plan: assignPlan,
        startDate,
        discount: Number(discount) || 0,
        amount: calculatedAmount,
        notes: notes || null,
      }

      const res = await fetch("/api/memberships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to assign membership")
      }

      setAssignModalOpen(false)
      fetchMemberships()
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setSaving(false)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    setPage(1)
  }

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlanFilter(e.target.value)
    setPage(1)
  }

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
    setPage(1)
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-semantic-error/10">
            <AlertCircle className="h-8 w-8 text-semantic-error" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink">Failed to load memberships</h2>
          <p className="mt-2 text-sm text-ink-muted">{error}</p>
          <Button onClick={fetchMemberships} className="mt-4">
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink">Memberships</h1>
          <p className="text-sm text-ink-muted mt-1">Manage all memberships and assign new plans</p>
        </div>
        <Button onClick={openAssignModal}>
          <Plus className="h-4 w-4" />
          Assign Membership
        </Button>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by member name or phone..."
                value={search}
                onChange={handleSearchChange}
                icon={<Search className="h-4 w-4" />}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                options={planOptions}
                value={planFilter}
                onChange={handlePlanChange}
              />
            </div>
            <div className="w-full sm:w-44">
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
          <CardHeader title="Memberships" description="Loading..." />
          <CardContent>
            <TableSkeleton rows={5} />
          </CardContent>
        </Card>
      ) : memberships.length === 0 ? (
        <Card>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-2">
                <CreditCard className="h-8 w-8 text-ink-tertiary" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-ink">No memberships found</h3>
              <p className="mt-2 text-sm text-ink-muted max-w-sm">
                {search || planFilter || statusFilter
                  ? "No memberships match your search criteria. Try adjusting your filters."
                  : "Get started by assigning a membership to a member."}
              </p>
              {!search && !planFilter && !statusFilter && (
                <Button onClick={openAssignModal} className="mt-4">
                  <Plus className="h-4 w-4" />
                  Assign Membership
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
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Member Name</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Phone</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Plan</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Start Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">End Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Days Remaining</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Status</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {memberships.map((membership) => {
                      const daysRemaining = getDaysRemaining(new Date(membership.endDate))
                      return (
                        <tr
                          key={membership.id}
                          className="border-b border-hairline/50 hover:bg-surface-2/50 cursor-pointer transition-colors"
                          onClick={() => router.push(`/members/${membership.memberId}`)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-2 text-ink">
                                {membership.member.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-sm font-medium text-ink">
                                {membership.member.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-ink-muted">{membership.member.phone}</td>
                          <td className="px-4 py-3 text-sm">{getPlanLabel(membership.plan)}</td>
                          <td className="px-4 py-3 text-sm text-ink-muted">{formatDate(membership.startDate)}</td>
                          <td className="px-4 py-3 text-sm text-ink-muted">{formatDate(membership.endDate)}</td>
                          <td className="px-4 py-3 text-sm">
                            <span className={`font-medium ${getDaysColor(daysRemaining)}`}>
                              {daysRemaining}d
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-ink font-medium">
                            {formatCurrency(membership.totalAmount || membership.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <Badge status={membership.status}>{membership.status}</Badge>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  router.push(`/members/${membership.memberId}`)
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
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
                Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total} memberships
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
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title="Assign Membership"
        description="Assign a new membership plan to a member"
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
                    onClick={() => {
                      setSelectedMemberId(m.id)
                      setMemberSearch(m.name)
                    }}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Plan"
              options={assignPlanOptions}
              value={assignPlan}
              onChange={(e) => setAssignPlan(e.target.value)}
            />
            <Input
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Discount (₹)"
              type="number"
              min="0"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              placeholder="0"
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-ink">Amount</label>
              <div className="block w-full rounded-[var(--radius-md)] border border-hairline bg-surface-1 px-3 py-2 text-sm text-ink">
                {assignPlan === "CUSTOM"
                  ? "Custom pricing"
                  : formatCurrency(calculatedAmount)}
              </div>
            </div>
          </div>

          <div>
            <Input
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-hairline">
            <Button variant="secondary" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} loading={saving}>
              Assign Membership
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
