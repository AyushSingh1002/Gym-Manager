"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Plus, Search, Edit2, Eye, ChevronLeft, ChevronRight, AlertCircle, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { TableSkeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/hooks/useDebounce"
import { formatDate, getPlanLabel } from "@/lib/utils"

interface MemberMembership {
  id: string
  plan: string
  status: string
  startDate: string
  endDate: string
  amount: number
}

interface Member {
  id: string
  firstName: string
  lastName: string
  email: string | null
  phone: string
  alternatePhone: string | null
  dateOfBirth: string | null
  gender: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  emergencyName: string | null
  emergencyPhone: string | null
  emergencyRelation: string | null
  photo: string | null
  notes: string | null
  status: string
  joinDate: string
  memberships: MemberMembership[]
}

interface MembersResponse {
  members: Member[]
  total: number
  page: number
  limit: number
  totalPages: number
}

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "ACTIVE", label: "Active" },
  { value: "EXPIRED", label: "Expired" },
  { value: "PENDING", label: "Pending" },
  { value: "CANCELLED", label: "Cancelled" },
]

const planOptions = [
  { value: "", label: "All Plans" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "HALF_YEARLY", label: "Half Yearly" },
  { value: "YEARLY", label: "Yearly" },
  { value: "CUSTOM", label: "Custom" },
]

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  alternatePhone: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  emergencyName: "",
  emergencyPhone: "",
  emergencyRelation: "",
  notes: "",
}

export default function MembersPage() {
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebounce(search, 300)
  const [statusFilter, setStatusFilter] = useState("")
  const [planFilter, setPlanFilter] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingMember, setEditingMember] = useState<Member | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams()
      if (debouncedSearch) params.set("search", debouncedSearch)
      if (statusFilter) params.set("status", statusFilter)
      if (planFilter) params.set("plan", planFilter)
      params.set("page", String(page))
      params.set("limit", "10")

      const res = await fetch(`/api/members?${params}`)
      if (!res.ok) throw new Error(res.status === 401 ? "Unauthorized" : "Failed to fetch members")
      const data: MembersResponse = await res.json()
      setMembers(data.members)
      setTotalPages(data.totalPages)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, statusFilter, planFilter, page])

  useEffect(() => {
    fetchMembers()
  }, [fetchMembers])

  const openAddModal = () => {
    setEditingMember(null)
    setForm(emptyForm)
    setFormError(null)
    setModalOpen(true)
  }

  const openEditModal = (member: Member) => {
    setEditingMember(member)
    setForm({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email || "",
      phone: member.phone,
      alternatePhone: member.alternatePhone || "",
      dateOfBirth: member.dateOfBirth ? member.dateOfBirth.split("T")[0] : "",
      gender: member.gender || "",
      address: member.address || "",
      city: member.city || "",
      state: member.state || "",
      pincode: member.pincode || "",
      emergencyName: member.emergencyName || "",
      emergencyPhone: member.emergencyPhone || "",
      emergencyRelation: member.emergencyRelation || "",
      notes: member.notes || "",
    })
    setFormError(null)
    setModalOpen(true)
  }

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setFormError(null)

      if (!form.firstName || !form.lastName || !form.phone) {
        setFormError("First name, last name, and phone are required")
        return
      }

      const body = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email || null,
        phone: form.phone,
        alternatePhone: form.alternatePhone || null,
        dateOfBirth: form.dateOfBirth || null,
        gender: form.gender || null,
        address: form.address || null,
        city: form.city || null,
        state: form.state || null,
        pincode: form.pincode || null,
        emergencyName: form.emergencyName || null,
        emergencyPhone: form.emergencyPhone || null,
        emergencyRelation: form.emergencyRelation || null,
        notes: form.notes || null,
      }

      const url = editingMember ? `/api/members/${editingMember.id}` : "/api/members"
      const method = editingMember ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to save member")
      }

      setModalOpen(false)
      fetchMembers()
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

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value)
    setPage(1)
  }

  const handlePlanChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPlanFilter(e.target.value)
    setPage(1)
  }

  const activePlan = (member: Member) => {
    if (member.memberships && member.memberships.length > 0) {
      return member.memberships[0]
    }
    return null
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-semantic-error/10">
            <AlertCircle className="h-8 w-8 text-semantic-error" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink">Failed to load members</h2>
          <p className="mt-2 text-sm text-ink-muted">{error}</p>
          <Button onClick={fetchMembers} className="mt-4">
            Try again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <main className="py-6 sm:py-8 lg:py-10">
      <div className="space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ink-primary text-balance">Members</h1>
            <p className="text-xs sm:text-sm text-ink-subtle mt-2">Manage and organize all gym members</p>
          </div>
          <Button onClick={openAddModal} size="lg" className="w-full sm:w-auto">
            <Plus className="h-5 w-5" />
            Add Member
          </Button>
        </div>

        <Card variant="elevated">
          <CardContent className="p-4 sm:p-5 md:p-6">
            <div className="space-y-3 sm:space-y-4">
              <Input
                placeholder="Search by name, phone or email..."
                value={search}
                onChange={handleSearchChange}
                icon={<Search className="h-5 w-5" />}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  options={statusOptions}
                  value={statusFilter}
                  onChange={handleStatusChange}
                />
                <Select
                  options={planOptions}
                  value={planFilter}
                  onChange={handlePlanChange}
                />
              </div>
            </div>
          </CardContent>
        </Card>

      {loading ? (
        <Card variant="elevated">
          <CardHeader title={`Members (${total})`} description="Loading member data..." />
          <CardContent>
            <TableSkeleton rows={5} />
          </CardContent>
        </Card>
      ) : members.length === 0 ? (
        <Card variant="elevated">
          <CardContent className="p-4 sm:p-6 md:p-8">
            <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
              <div className="mx-auto flex h-16 sm:h-20 w-16 sm:w-20 items-center justify-center rounded-2xl bg-surface-2 mb-3 sm:mb-4">
                <Users className="h-8 sm:h-10 w-8 sm:w-10 text-ink-subtle" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-ink-primary">No members found</h3>
              <p className="mt-2 text-xs sm:text-sm text-ink-tertiary max-w-sm">
                {search || statusFilter || planFilter
                  ? "No members match your search criteria. Try adjusting your filters."
                  : "Get started by adding your first member to the gym."}
              </p>
              {!search && !statusFilter && !planFilter && (
                <Button onClick={openAddModal} className="mt-6 w-full sm:w-auto">
                  <Plus className="h-4 w-4" />
                  Add Member
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block">
            <Card variant="elevated">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-hairline bg-surface-2/30">
                        <th className="text-left px-4 sm:px-6 py-4 text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Name</th>
                        <th className="text-left px-4 sm:px-6 py-4 text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Phone</th>
                        <th className="text-left px-4 sm:px-6 py-4 text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Email</th>
                        <th className="text-left px-4 sm:px-6 py-4 text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Plan</th>
                        <th className="text-left px-4 sm:px-6 py-4 text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Status</th>
                        <th className="text-left px-4 sm:px-6 py-4 text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Join Date</th>
                        <th className="text-right px-4 sm:px-6 py-4 text-xs font-semibold text-ink-tertiary uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-hairline">
                      {members.map((member) => {
                        const plan = activePlan(member)
                        return (
                          <tr
                            key={member.id}
                            className="border-b border-hairline/50 hover:bg-surface-2 cursor-pointer transition-colors duration-150"
                            onClick={() => router.push(`/members/${member.id}`)}
                          >
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 font-medium text-primary border border-primary/20 flex-shrink-0">
                                  {(member.firstName.charAt(0) + member.lastName.charAt(0)).toUpperCase()}
                                </div>
                                <span className="font-medium text-ink-primary">
                                  {member.firstName} {member.lastName}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-ink-secondary">{member.phone}</td>
                            <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-ink-secondary truncate">{member.email || "-"}</td>
                            <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm font-medium">{plan ? getPlanLabel(plan.plan) : "-"}</td>
                            <td className="px-4 sm:px-6 py-4">
                              <Badge size="sm" status={member.status}>{member.status}</Badge>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-xs sm:text-sm text-ink-secondary">{formatDate(member.joinDate)}</td>
                            <td className="px-4 sm:px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    router.push(`/members/${member.id}`)
                                  }}
                                  title="View member details"
                                  aria-label="View member"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openEditModal(member)
                                  }}
                                  title="Edit member"
                                  aria-label="Edit member"
                                >
                                  <Edit2 className="h-4 w-4" />
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
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {members.map((member) => {
              const plan = activePlan(member)
              return (
                <Card 
                  key={member.id}
                  interactive 
                  variant="elevated"
                  className="cursor-pointer"
                  onClick={() => router.push(`/members/${member.id}`)}
                >
                  <CardContent className="p-4 sm:p-5">
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary border border-primary/20 flex-shrink-0">
                            {(member.firstName.charAt(0) + member.lastName.charAt(0)).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-ink-primary truncate">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-xs text-ink-tertiary mt-0.5">{member.phone}</p>
                          </div>
                        </div>
                        <Badge size="sm" status={member.status}>{member.status}</Badge>
                      </div>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 gap-3 py-2 border-y border-hairline/50">
                        <div>
                          <p className="text-xs text-ink-tertiary font-medium">Plan</p>
                          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">{plan ? getPlanLabel(plan.plan) : "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-ink-tertiary font-medium">Join Date</p>
                          <p className="text-xs sm:text-sm text-ink-secondary mt-0.5">{formatDate(member.joinDate)}</p>
                        </div>
                        {member.email && (
                          <div className="col-span-2">
                            <p className="text-xs text-ink-tertiary font-medium">Email</p>
                            <p className="text-xs sm:text-sm text-ink-secondary truncate mt-0.5">{member.email}</p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/members/${member.id}`)
                          }}
                          className="flex-1"
                          aria-label="View member"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            openEditModal(member)
                          }}
                          className="flex-1"
                          aria-label="Edit member"
                        >
                          <Edit2 className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-xs sm:text-sm text-ink-muted">
                Showing {(page - 1) * 10 + 1}-{Math.min(page * 10, total)} of {total} members
              </p>
              <div className="flex items-center gap-2 overflow-x-auto">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex-shrink-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">Previous</span>
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setPage(p)}
                    className="min-w-10 sm:min-w-[40px] flex-shrink-0"
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="flex-shrink-0"
                >
                  <span className="hidden sm:inline mr-1">Next</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      <Modal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setForm(emptyForm); setFormError(null); setEditingMember(null); }}
        title={editingMember ? "Edit Member" : "Add Member"}
        description={editingMember ? "Update member details" : "Add a new member to the gym"}
        size="xl"
      >
        <div className="space-y-5 sm:space-y-6 overflow-y-auto max-h-[60vh] pr-1">
          {formError && (
            <div className="flex items-start gap-3 rounded-lg bg-semantic-error/10 border border-semantic-error/20 p-3 sm:p-4 text-xs sm:text-sm text-semantic-error">
              <AlertCircle className="h-4 w-4 shrink-0 flex-shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-ink mb-3">Personal Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                id="firstName"
                name="firstName"
                label="First Name"
                value={form.firstName}
                onChange={(e) => handleFormChange("firstName", e.target.value)}
                placeholder="John"
              />
              <Input
                id="lastName"
                name="lastName"
                label="Last Name"
                value={form.lastName}
                onChange={(e) => handleFormChange("lastName", e.target.value)}
                placeholder="Doe"
              />
              <Input
                id="email"
                name="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => handleFormChange("email", e.target.value)}
                placeholder="john@example.com"
              />
              <Input
                id="phone"
                name="phone"
                label="Phone"
                value={form.phone}
                onChange={(e) => handleFormChange("phone", e.target.value)}
                placeholder="+91 9876543210"
              />
              <Input
                id="alternatePhone"
                name="alternatePhone"
                label="Alternate Phone"
                value={form.alternatePhone}
                onChange={(e) => handleFormChange("alternatePhone", e.target.value)}
                placeholder="+91 9876543210"
              />
              <Input
                id="dateOfBirth"
                name="dateOfBirth"
                label="Date of Birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => handleFormChange("dateOfBirth", e.target.value)}
              />
              <Select
                id="gender"
                name="gender"
                label="Gender"
                value={form.gender}
                onChange={(e) => handleFormChange("gender", e.target.value)}
                options={[
                  { value: "Male", label: "Male" },
                  { value: "Female", label: "Female" },
                  { value: "Other", label: "Other" },
                ]}
                placeholder="Select gender"
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-ink mb-3">Address</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="sm:col-span-2">
                <Input
                  id="address"
                  name="address"
                  label="Address"
                  value={form.address}
                  onChange={(e) => handleFormChange("address", e.target.value)}
                  placeholder="Street address"
                />
              </div>
              <Input
                id="city"
                name="city"
                label="City"
                value={form.city}
                onChange={(e) => handleFormChange("city", e.target.value)}
                placeholder="Mumbai"
              />
              <Input
                id="state"
                name="state"
                label="State"
                value={form.state}
                onChange={(e) => handleFormChange("state", e.target.value)}
                placeholder="Maharashtra"
              />
              <Input
                id="pincode"
                name="pincode"
                label="Pincode"
                value={form.pincode}
                onChange={(e) => handleFormChange("pincode", e.target.value)}
                placeholder="400001"
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-ink mb-3">Emergency Contact</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Input
                id="emergencyName"
                name="emergencyName"
                label="Name"
                value={form.emergencyName}
                onChange={(e) => handleFormChange("emergencyName", e.target.value)}
                placeholder="Jane Doe"
              />
              <Input
                id="emergencyPhone"
                name="emergencyPhone"
                label="Phone"
                value={form.emergencyPhone}
                onChange={(e) => handleFormChange("emergencyPhone", e.target.value)}
                placeholder="+91 9876543210"
              />
              <Input
                id="emergencyRelation"
                name="emergencyRelation"
                label="Relation"
                value={form.emergencyRelation}
                onChange={(e) => handleFormChange("emergencyRelation", e.target.value)}
                placeholder="Spouse"
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-ink mb-3">Notes</h4>
            <Input
              id="notes"
              name="notes"
              value={form.notes}
              onChange={(e) => handleFormChange("notes", e.target.value)}
              placeholder="Any additional notes..."
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-4 border-t border-hairline">
            <Button variant="secondary" onClick={() => { setModalOpen(false); setForm(emptyForm); setFormError(null); setEditingMember(null); }} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button onClick={handleSave} loading={saving} className="w-full sm:w-auto">
              {editingMember ? "Save Changes" : "Add Member"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </main>
  )
}
