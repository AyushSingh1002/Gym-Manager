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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Loading...</h1>
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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 dark:bg-red-950">
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load member</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error}</p>
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
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 dark:bg-gray-800">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Member not found</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">The member you are looking for does not exist.</p>
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-2xl font-bold text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 shrink-0">
              {getInitials(member.firstName, member.lastName)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {member.firstName} {member.lastName}
                </h2>
                <Badge status={member.status}>{member.status}</Badge>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Member since {formatDate(member.joinDate)}
              </p>
              <div className="flex flex-wrap gap-4 mt-3">
                {member.email && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <Mail className="h-3.5 w-3.5" />
                    {member.email}
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                  <Phone className="h-3.5 w-3.5" />
                  {member.phone}
                </div>
                {member.city && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                    <MapPin className="h-3.5 w-3.5" />
                    {member.city}{member.state ? `, ${member.state}` : ""}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">Full Name</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.firstName} {member.lastName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Gender</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.gender || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Date of Birth</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
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
                    <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.email || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.phone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Alternate Phone</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.alternatePhone || "-"}</p>
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">Address</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.address}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">City</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.city || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">State</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.state || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Pincode</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.pincode || "-"}</p>
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
                      <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.emergencyName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.emergencyPhone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Relation</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{member.emergencyRelation || "-"}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {member.notes && (
              <Card>
                <CardHeader title="Notes" />
                <CardContent>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{member.notes}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-4">
            <Card hover className="cursor-pointer" onClick={() => setActiveTab("attendance")}>
              <CardContent className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-950">
                  <Calendar className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{member.attendance.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total Attendance</p>
                </div>
              </CardContent>
            </Card>

            <Card hover className="cursor-pointer" onClick={() => setActiveTab("memberships")}>
              <CardContent className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                  <Dumbbell className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{member.memberships.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Memberships</p>
                </div>
              </CardContent>
            </Card>

            <Card hover className="cursor-pointer" onClick={() => setActiveTab("payments")}>
              <CardContent className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                  <CreditCard className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{member.payments.length}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Payments</p>
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
                <Clock className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No attendance records found</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={handleQuickCheckIn} loading={checkingIn}>
                  <Plus className="h-4 w-4" />
                  Record First Check-in
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Check In</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Check Out</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Type</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {member.attendance.map((record) => (
                      <tr key={record.id}>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{formatDate(record.date)}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDateTime(record.checkIn)}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
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
                <CreditCard className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No payment records found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Method</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {member.payments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{formatDate(payment.date)}</td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{formatCurrency(payment.amount)}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{payment.method}</td>
                        <td className="px-4 py-3">
                          <Badge status={payment.status}>{payment.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{payment.receiptNo || "-"}</td>
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
                <Dumbbell className="h-10 w-10 text-gray-300 dark:text-gray-600" />
                <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">No memberships found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Plan</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Start Date</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">End Date</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {member.memberships.map((membership) => (
                      <tr key={membership.id}>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{getPlanLabel(membership.plan)}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(membership.startDate)}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{formatDate(membership.endDate)}</td>
                        <td className="px-4 py-3">
                          <Badge status={membership.status}>{membership.status}</Badge>
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{formatCurrency(membership.totalAmount)}</td>
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
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Edit form content would go here, reusing the same pattern from the members page.
        </p>
        <div className="flex items-center justify-end gap-3 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
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
