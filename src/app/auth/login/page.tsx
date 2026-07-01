"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dumbbell, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ email: "", password: "" })
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})

  function validate() {
    const errs: typeof errors = {}
    if (!form.email.trim()) {
      errs.email = "Email is required"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errs.email = "Invalid email format"
    }
    if (!form.password) {
      errs.password = "Password is required"
    }
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ general: data.error || "Login failed" })
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setErrors({ general: "An unexpected error occurred" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-canvas">
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden bg-canvas">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="relative z-10 text-center px-12 animate-fade-slide-up">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[var(--radius-xl)] bg-primary/10 ring-1 ring-primary/20 mb-6">
            <Dumbbell className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-[40px] font-semibold text-ink mb-3 tracking-tight">GymFlow</h1>
          <p className="text-[15px] text-ink-muted max-w-sm mx-auto leading-relaxed">
            Streamline your gym management. Track memberships, attendance, and payments all in one place.
          </p>
          <div className="mt-10 flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-2xl font-semibold text-ink">500+</p>
              <p className="text-sm text-ink-muted mt-0.5">Gyms</p>
            </div>
            <div className="w-px h-10 bg-hairline" />
            <div className="text-center">
              <p className="text-2xl font-semibold text-ink">50K+</p>
              <p className="text-sm text-ink-muted mt-0.5">Members</p>
            </div>
            <div className="w-px h-10 bg-hairline" />
            <div className="text-center">
              <p className="text-2xl font-semibold text-ink">99.9%</p>
              <p className="text-sm text-ink-muted mt-0.5">Uptime</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-sm animate-fade-slide-up">
          <div className="lg:hidden flex items-center justify-center gap-2.5 mb-8">
            <div className="flex items-center justify-center w-9 h-9 rounded-[var(--radius-sm)] bg-primary">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-semibold text-ink">GymFlow</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-[28px] font-semibold text-ink tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm text-ink-muted">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {errors.general && (
              <div className="rounded-[var(--radius-md)] bg-semantic-error/10 border border-semantic-error/20 px-4 py-2.5 text-sm text-semantic-error animate-fade-in">
                {errors.general}
              </div>
            )}

            <Input
              id="email"
              label="Email"
              type="email"
              placeholder="admin@gymflow.com"
              value={form.email}
              error={errors.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              autoComplete="email"
            />

            <div>
              <Input
                id="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={form.password}
                error={errors.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="mt-1 text-xs text-primary hover:opacity-80 transition-opacity"
              >
                {showPassword ? "Hide password" : "Show password"}
              </button>
            </div>

            <Button type="submit" loading={loading} className="w-full h-11" size="lg">
              Sign in
            </Button>

            <p className="text-center text-xs text-ink-tertiary">
              Default: admin@gymflow.com / admin123
            </p>
          </form>

          <p className="mt-8 text-center text-xs text-ink-tertiary">
            Powered by{" "}
            <span className="font-medium text-ink">GymFlow</span>
          </p>
        </div>
      </div>
    </div>
  )
}
