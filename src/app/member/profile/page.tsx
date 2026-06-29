"use client"
import { useState, useEffect, useRef } from "react"
import { User, Camera, Save, Lock, Phone, Mail, Calendar, MapPin, Target, Weight, Ruler, AlertCircle, CheckCircle, Loader2 } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { formatDate, getInitials } from "@/lib/utils"

interface MemberProfile {
  id: string
  memberId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  alternatePhone: string | null
  photo: string | null
  dateOfBirth: string | null
  gender: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  emergencyName: string | null
  emergencyPhone: string | null
  emergencyRelation: string | null
  weight: number | null
  height: number | null
  goal: string | null
  fitnessLevel: string | null
  status: string
}

const GOAL_OPTIONS = [
  { value: "WEIGHT_LOSS", label: "Weight Loss" },
  { value: "MUSCLE_GAIN", label: "Muscle Gain" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "ENDURANCE", label: "Endurance" },
  { value: "GENERAL_FITNESS", label: "General Fitness" },
]

function ProfileSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col items-center py-8">
        <div className="h-28 w-28 rounded-full bg-gray-200 dark:bg-gray-700" />
        <div className="mt-4 h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="mt-1 h-4 w-28 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-10 w-full bg-gray-200 dark:bg-gray-700 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function MemberProfile() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [profile, setProfile] = useState<MemberProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
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
    weight: "",
    height: "",
    goal: "",
    fitnessLevel: "",
  })

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [updatingPassword, setUpdatingPassword] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  async function fetchProfile() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/member/auth/me")
      if (!res.ok) throw new Error("Failed to load profile")
      const data = await res.json()
      const member: MemberProfile = data.member
      setProfile(member)
      setForm({
        firstName: member.firstName || "",
        lastName: member.lastName || "",
        email: member.email || "",
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
        weight: member.weight?.toString() || "",
        height: member.height?.toString() || "",
        goal: member.goal || "",
        fitnessLevel: member.fitnessLevel || "",
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/member/upload", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      if (profile) setProfile({ ...profile, photo: data.url })
      setToast({ type: "success", message: "Photo updated!" })
    } catch {
      setToast({ type: "error", message: "Failed to upload photo" })
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setToast(null)
    try {
      const body: Record<string, unknown> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
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
        weight: form.weight ? parseFloat(form.weight) : null,
        height: form.height ? parseFloat(form.height) : null,
        goal: form.goal || null,
        fitnessLevel: form.fitnessLevel || null,
      }

      const res = await fetch("/api/member/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Failed to save profile")
      const data = await res.json()
      setProfile(data.member)
      setToast({ type: "success", message: "Profile saved successfully!" })
    } catch (err) {
      setToast({ type: "error", message: err instanceof Error ? err.message : "Failed to save" })
    } finally {
      setSaving(false)
    }
  }

  async function handleUpdatePassword() {
    setPasswordError(null)

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Passwords do not match")
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      return
    }

    setUpdatingPassword(true)
    try {
      const res = await fetch("/api/member/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          password: passwordForm.newPassword,
        }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || "Failed to update password")
      }
      setToast({ type: "success", message: "Password updated successfully!" })
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" })
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to update password")
    } finally {
      setUpdatingPassword(false)
    }
  }

  const initials = profile ? getInitials(profile.firstName, profile.lastName) : "?"
  const memberId = profile?.memberId || ""

  if (loading) return <ProfileSkeleton />

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
        <div className="rounded-full bg-red-100 p-4 dark:bg-red-900/30">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Failed to load profile</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{error}</p>
        <Button onClick={fetchProfile} className="mt-4">Try Again</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg text-sm font-medium animate-in slide-in-from-top-2 ${
            toast.type === "success"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800"
              : "bg-red-50 text-red-700 border border-red-200 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Profile</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage your personal information and settings</p>
        </div>
        <div className="rounded-xl bg-indigo-500/10 p-3 dark:bg-indigo-400/10">
          <User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
        </div>
      </div>

      {/* Profile Photo */}
      <div className="flex flex-col items-center py-6">
        <div className="relative group">
          <div className="h-28 w-28 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl font-bold text-white shadow-lg shadow-indigo-500/20 overflow-hidden">
            {profile?.photo ? (
              <img
                src={profile.photo}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute bottom-1 right-1 rounded-full bg-white dark:bg-gray-800 p-2 shadow-md border border-gray-200 dark:border-gray-700 text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">
          {profile?.firstName} {profile?.lastName}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Member ID: {memberId}</p>
      </div>

      {/* Personal Information */}
      <Card>
        <CardHeader title="Personal Information" description="Your basic details and contact information" />
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="firstName"
              label="First Name"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              icon={<User className="h-4 w-4" />}
            />
            <Input
              id="lastName"
              label="Last Name"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              icon={<User className="h-4 w-4" />}
            />
            <Input
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              icon={<Mail className="h-4 w-4" />}
            />
            <Input
              id="phone"
              label="Phone"
              value={profile?.phone || ""}
              icon={<Phone className="h-4 w-4" />}
              readOnly
              className="text-gray-400 dark:text-gray-500"
            />
            <Input
              id="alternatePhone"
              label="Alternate Phone"
              value={form.alternatePhone}
              onChange={(e) => setForm((f) => ({ ...f, alternatePhone: e.target.value }))}
              icon={<Phone className="h-4 w-4" />}
            />
            <Input
              id="dateOfBirth"
              label="Date of Birth"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm((f) => ({ ...f, dateOfBirth: e.target.value }))}
              icon={<Calendar className="h-4 w-4" />}
            />
            <Input
              id="gender"
              label="Gender"
              value={form.gender}
              onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))}
              icon={<User className="h-4 w-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader title="Address" description="Your current residential address" />
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Input
                id="address"
                label="Address"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                icon={<MapPin className="h-4 w-4" />}
              />
            </div>
            <Input
              id="city"
              label="City"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              icon={<MapPin className="h-4 w-4" />}
            />
            <Input
              id="state"
              label="State"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              icon={<MapPin className="h-4 w-4" />}
            />
            <Input
              id="pincode"
              label="Pincode"
              value={form.pincode}
              onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))}
              icon={<MapPin className="h-4 w-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Emergency Contact */}
      <Card>
        <CardHeader title="Emergency Contact" description="Who to reach in case of an emergency" />
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="emergencyName"
              label="Contact Name"
              value={form.emergencyName}
              onChange={(e) => setForm((f) => ({ ...f, emergencyName: e.target.value }))}
              icon={<User className="h-4 w-4" />}
            />
            <Input
              id="emergencyPhone"
              label="Contact Phone"
              value={form.emergencyPhone}
              onChange={(e) => setForm((f) => ({ ...f, emergencyPhone: e.target.value }))}
              icon={<Phone className="h-4 w-4" />}
            />
            <Input
              id="emergencyRelation"
              label="Relation"
              value={form.emergencyRelation}
              onChange={(e) => setForm((f) => ({ ...f, emergencyRelation: e.target.value }))}
              icon={<User className="h-4 w-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Fitness Info */}
      <Card>
        <CardHeader title="Fitness Information" description="Your fitness profile and goals" />
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              id="weight"
              label="Weight (kg)"
              type="number"
              value={form.weight}
              onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
              icon={<Weight className="h-4 w-4" />}
            />
            <Input
              id="height"
              label="Height (cm)"
              type="number"
              value={form.height}
              onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))}
              icon={<Ruler className="h-4 w-4" />}
            />
            <Select
              id="goal"
              label="Fitness Goal"
              value={form.goal}
              onChange={(e) => setForm((f) => ({ ...f, goal: e.target.value }))}
              options={GOAL_OPTIONS}
              placeholder="Select your goal"
            />
            <Input
              id="fitnessLevel"
              label="Fitness Level"
              value={form.fitnessLevel}
              onChange={(e) => setForm((f) => ({ ...f, fitnessLevel: e.target.value }))}
              placeholder="e.g. Beginner, Intermediate, Advanced"
              icon={<Target className="h-4 w-4" />}
            />
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader title="Change Password" description="Update your account password" />
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              id="currentPassword"
              label="Current Password"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
              icon={<Lock className="h-4 w-4" />}
            />
            <Input
              id="newPassword"
              label="New Password"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
              icon={<Lock className="h-4 w-4" />}
            />
            <Input
              id="confirmPassword"
              label="Confirm New Password"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
              icon={<Lock className="h-4 w-4" />}
            />
          </div>
          {passwordError && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/30 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {passwordError}
            </div>
          )}
          <Button
            variant="secondary"
            className="mt-4"
            onClick={handleUpdatePassword}
            loading={updatingPassword}
            disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
          >
            <Lock className="h-4 w-4 mr-1" />
            Update Password
          </Button>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end pb-8">
        <Button
          size="lg"
          onClick={handleSave}
          loading={saving}
          className="min-w-[200px]"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  )
}
