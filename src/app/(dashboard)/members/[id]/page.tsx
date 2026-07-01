"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  User, Phone, Mail, Calendar, MapPin, AlertTriangle, Plus, CheckCircle,
  Edit2, ArrowLeft, Dumbbell, CreditCard, Clock
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { TableSkeleton } from "@/components/ui/skeleton"
import { formatDate, formatDateTime, formatCurrency, getInitials, getPlanLabel, getStatusColor } from "@/lib/utils"

interface MemberMembership {
  id: string
  plan: string
  startDate: string
  endDate: string
  status: string
  amount: number
  discount: number
  totalAmount: number
  paymentStatus: string
  notes: string | null
  createdAt: string
}

interface MemberPayment {
  id: string
  amount: number
  method: string
  status: string
  receiptNo: string | null
  date: string
  notes: string | null
  membershipId: string | null
}

interface MemberAttendance {
  id: string
  date: string
  checkIn: string
  checkOut: string | null
  type: string
  notes: string | null
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
  payments: MemberPayment[]
  attendance: MemberAttendance[]
}

type Tab = "overview" | "attendance" | "payments" | "memberships"

export default function MemberDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [member, setMember] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Overview", icon: <User className="h-4 w-4" /> },
    { id: "attendance", label: "Attendance", icon: <Clock className="h-4 w-4" /> },
    { id: "payments", label: "Payments", icon: <CreditCard className="h-4 w-4" /> },
    { id: "memberships", label: "Memberships", icon: <Dumbbell className="h-4 w-4" /> },
  ]

  useEffect(() => {
    async function fetchMember() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/members/${params.id}`)
        if (!res.ok) {
          if (res.status === 404) throw new Error("Member not found")
          if (res.status === 401) throw new Error("Unauthorized")
          throw new Error("Failed to fetch member")
        }
        const data = await res.json()
        setMember(data.member)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong")
      } finally {
        setLoading(false)
      }
    }
    fetchMember()
  }, [params.id])

  const handleQuickCheckIn = async () => {
    try {
      setCheckingIn(true)
      const res = await fetch(`/api/members/${params.id}/attendance`, {
        method: "POST",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to check in")
      }
      const data = await res.json()
      setMember((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          attendance: [data.attendance, ...prev.attendance],
        }
      })
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to check in")
    } finally {
      setCheckingIn(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-ink">Loading...</h1>
          </div>
        </div>
        <Card>
          <CardContent>
            <TableSkeleton rows={5} />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-semantic-error/10">
            <AlertTriangle className="h-8 w-8 text-semantic-error" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink">Failed to load member</h2>
          <p className="mt-2 text-sm text-ink-muted">{error}</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go back
          </Button>
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-2">
            <User className="h-8 w-8 text-ink-tertiary" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-ink">Member not found</h2>
          <p className="mt-2 text-sm text-ink-muted">The member you are looking for does not exist.</p>
          <Button onClick={() => router.push("/members")} className="mt-4">
            Back to Members
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-ink">
              {member.firstName} {member.lastName}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleQuickCheckIn} loading={checkingIn}>
            <CheckCircle className="h-4 w-4" />
            Quick Check-in
          </Button>
          <Button size="sm" onClick={() => setEditModalOpen(true)}>
            <Edit2 className="h-4 w-4" />
            Edit Member
          </Button>
        </div>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface-2 text-ink text-xl font-semibold shrink-0">
              {getInitials(member.firstName, member.lastName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-semibold text-ink">
                  {member.firstName} {member.lastName}
                </h2>
                <Badge status={member.status}>{member.status}</Badge>
              </div>
              <p className="text-sm text-ink-muted mt-1">
                Member since {formatDate(member.joinDate)}
              </p>
              <div className="flex flex-wrap gap-4 mt-3">
                {member.email && (
                  <div className="flex items-center gap-1.5 text-sm text-ink-muted">
                    <Mail className="h-3.5 w-3.5" />
                    {member.email}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-ink-muted">
                  <Phone className="h-3.5 w-3.5" />
                  {member.phone}
                </div>
                {member.city && (
                  <div className="flex items-center gap-1.5 text-sm text-ink-muted">
                    <MapPin className="h-3.5 w-3.5" />
                    {member.city}{member.state ? `, ${member.state}` : ""}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-1 border-b border-hairline overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-ink-muted hover:text-ink"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader title="Personal Information" />
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-ink-muted">Full Name</p>
                    <p className="text-sm font-medium text-ink">{member.firstName} {member.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Gender</p>
                    <p className="text-sm font-medium text-ink">{member.gender || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Date of Birth</p>
                    <p className="text-sm font-medium text-ink">
                      {member.dateOfBirth ? formatDate(member.dateOfBirth) : "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader title="Contact Details" />
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-ink-muted">Email</p>
                    <p className="text-sm font-medium text-ink">{member.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Phone</p>
                    <p className="text-sm font-medium text-ink">{member.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-ink-muted">Alternate Phone</p>
                    <p className="text-sm font-medium text-ink">{member.alternatePhone || "-"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {member.address && (
              <Card>
                <CardHeader title="Address" />
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <p className="text-xs text-ink-muted">Address</p>
                      <p className="text-sm font-medium text-ink">{member.address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted">City</p>
                      <p className="text-sm font-medium text-ink">{member.city || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted">State</p>
                      <p className="text-sm font-medium text-ink">{member.state || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted">Pincode</p>
                      <p className="text-sm font-medium text-ink">{member.pincode || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {member.emergencyName && (
              <Card>
                <CardHeader title="Emergency Contact" />
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-ink-muted">Name</p>
                      <p className="text-sm font-medium text-ink">{member.emergencyName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted">Phone</p>
                      <p className="text-sm font-medium text-ink">{member.emergencyPhone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-ink-muted">Relation</p>
                      <p className="text-sm font-medium text-ink">{member.emergencyRelation || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {member.notes && (
              <Card>
                <CardHeader title="Notes" />
                <CardContent>
                  <p className="text-sm text-ink-muted whitespace-pre-wrap">{member.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card hover className="cursor-pointer" onClick={() => setActiveTab("attendance")}>
              <CardContent className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-semantic-success/15 text-semantic-success">
                  <Calendar className="h-6 w-6 text-semantic-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-ink">{member.attendance.length}</p>
                  <p className="text-xs text-ink-muted">Total Attendance</p>
                </div>
              </CardContent>
            </Card>

            <Card hover className="cursor-pointer" onClick={() => setActiveTab("memberships")}>
              <CardContent className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                  <Dumbbell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-ink">{member.memberships.length}</p>
                  <p className="text-xs text-ink-muted">Memberships</p>
                </div>
              </CardContent>
            </Card>

            <Card hover className="cursor-pointer" onClick={() => setActiveTab("payments")}>
              <CardContent className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                  <CreditCard className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-ink">{member.payments.length}</p>
                  <p className="text-xs text-ink-muted">Payments</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "attendance" && (
        <Card>
          <CardHeader
            title="Attendance Records"
            description={`${member.attendance.length} total check-ins`}
            action={
              <Button size="sm" onClick={handleQuickCheckIn} loading={checkingIn}>
                <Plus className="h-4 w-4" />
                Check In
              </Button>
            }
          />
          <CardContent className="p-0">
            {member.attendance.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Clock className="h-10 w-10 text-ink-tertiary" />
                <p className="mt-3 text-sm text-ink-muted">No attendance records found</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={handleQuickCheckIn} loading={checkingIn}>
                  <Plus className="h-4 w-4" />
                  Record First Check-in
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hairline">
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Check In</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Check Out</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {member.attendance.map((record) => (
                      <tr key={record.id}>
                        <td className="px-4 py-3 text-sm text-ink">{formatDate(record.date)}</td>
                        <td className="px-4 py-3 text-sm text-ink-muted">{formatDateTime(record.checkIn)}</td>
                        <td className="px-4 py-3 text-sm text-ink-muted">
                          {record.checkOut ? formatDateTime(record.checkOut) : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <Badge status={record.type === "check-in" ? "ACTIVE" : "EXPIRED"}>
                            {record.type}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "payments" && (
        <Card>
          <CardHeader
            title="Payment History"
            description={`${member.payments.length} total payments`}
            action={
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Record Payment
              </Button>
            }
          />
          <CardContent className="p-0">
            {member.payments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <CreditCard className="h-10 w-10 text-ink-tertiary" />
                <p className="mt-3 text-sm text-ink-muted">No payment records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hairline">
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Method</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {member.payments.map((payment) => (
                      <tr key={payment.id}>
<td className="px-4 py-3 text-sm text-ink">{formatDate(payment.date)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-ink">{formatCurrency(payment.amount)}</td>
                          <td className="px-4 py-3 text-sm text-ink-muted">{payment.method}</td>
                          <td className="px-4 py-3">
                          <Badge status={payment.status}>{payment.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-ink-muted">{payment.receiptNo || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "memberships" && (
        <Card>
          <CardHeader
            title="Memberships"
            description={`${member.memberships.length} total memberships`}
            action={
              <Button size="sm">
                <Plus className="h-4 w-4" />
                Assign Membership
              </Button>
            }
          />
          <CardContent className="p-0">
            {member.memberships.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <Dumbbell className="h-10 w-10 text-ink-tertiary" />
                <p className="mt-3 text-sm text-ink-muted">No memberships found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-hairline">
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Plan</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Start Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">End Date</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Amount</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-ink-muted uppercase tracking-wider">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline">
                    {member.memberships.map((membership) => (
                      <tr key={membership.id}>
<td className="px-4 py-3 text-sm font-medium text-ink">{getPlanLabel(membership.plan)}</td>
                          <td className="px-4 py-3 text-sm text-ink-muted">{formatDate(membership.startDate)}</td>
                          <td className="px-4 py-3 text-sm text-ink-muted">{formatDate(membership.endDate)}</td>
                          <td className="px-4 py-3">
                          <Badge status={membership.status}>{membership.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-ink">{formatCurrency(membership.totalAmount)}</td>
                        <td className="px-4 py-3">
                          <Badge status={membership.paymentStatus}>{membership.paymentStatus}</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Member"
        description="Update member information"
        size="xl"
      >
        <p className="text-sm text-ink-muted">
          Edit form content would go here, reusing the same pattern from the members page.
        </p>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-hairline">
          <Button variant="secondary" onClick={() => setEditModalOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setEditModalOpen(false)}>
            Save Changes
          </Button>
        </div>
      </Modal>
    </div>
  )
}
