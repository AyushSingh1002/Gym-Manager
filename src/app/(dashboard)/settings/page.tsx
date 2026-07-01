"use client"

import { useState, useEffect } from "react"
import { Settings as SettingsIcon, Save, Dumbbell, Phone, Mail, Globe, MapPin, CreditCard, Loader2 } from "lucide-react"
import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CardSkeleton } from "@/components/ui/skeleton"

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [settings, setSettings] = useState({
    name: "GymFlow",
    address: "",
    phone: "",
    email: "",
    website: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
    razorpayKeyId: "",
    razorpayKeySecret: "",
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        setSettings(data)
      }
    } catch {
      setError("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error("Failed to save")
      setSuccess("Settings saved successfully")
    } catch {
      setError("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Settings</h1>
          <p className="text-sm text-ink-muted mt-1">Manage your gym configuration</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
        <p className="text-sm text-ink-muted mt-1">Manage your gym configuration</p>
      </div>

      {error && (
        <div className="rounded-lg bg-semantic-error/10 border border-semantic-error/20 p-4 text-sm text-semantic-error">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-semantic-success/15 p-4 text-sm text-semantic-success">
          {success}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader title="General Information" description="Basic details about your gym" />
          <CardContent className="space-y-4">
            <Input
              label="Gym Name"
              id="name"
              value={settings.name}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              icon={<Dumbbell className="h-4 w-4" />}
            />
            <Input
              label="Address"
              id="address"
              value={settings.address || ""}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
              icon={<MapPin className="h-4 w-4" />}
            />
            <Input
              label="Phone"
              id="phone"
              value={settings.phone || ""}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              icon={<Phone className="h-4 w-4" />}
            />
            <Input
              label="Email"
              id="email"
              type="email"
              value={settings.email || ""}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              icon={<Mail className="h-4 w-4" />}
            />
            <Input
              label="Website"
              id="website"
              value={settings.website || ""}
              onChange={(e) => setSettings({ ...settings, website: e.target.value })}
              icon={<Globe className="h-4 w-4" />}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Payment Configuration" description="Razorpay payment gateway settings" />
          <CardContent className="space-y-4">
            <Input
              label="Razorpay Key ID"
              id="razorpayKeyId"
              value={settings.razorpayKeyId || ""}
              onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value })}
              icon={<CreditCard className="h-4 w-4" />}
              placeholder="rzp_test_..."
            />
            <Input
              label="Razorpay Key Secret"
              id="razorpayKeySecret"
              type="password"
              value={settings.razorpayKeySecret || ""}
              onChange={(e) => setSettings({ ...settings, razorpayKeySecret: e.target.value })}
              icon={<CreditCard className="h-4 w-4" />}
              placeholder="Enter secret key"
            />
            <div className="pt-2">
              <p className="text-xs text-ink-muted">
                Your Razorpay keys are stored securely and used only for payment processing.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} loading={saving}>
          <Save className="h-4 w-4" />
          Save Settings
        </Button>
      </div>
    </div>
  )
}
