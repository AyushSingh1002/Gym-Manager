"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
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
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-indigo-400 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center px-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm mb-8 ring-1 ring-white/20">
            <Dumbbell className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">GymFlow</h1>
          <p className="text-lg text-indigo-200 max-w-sm mx-auto leading-relaxed">
            Streamline your gym management. Track memberships, attendance, and payments all in one place.
          </p>
          <div className="mt-12 flex items-center justify-center gap-8 text-indigo-300 text-sm">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">500+</p>
              <p>Gyms</p>
            </div>
            <div className="w-px h-10 bg-indigo-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">50K+</p>
              <p>Members</p>
            </div>
            <div className="w-px h-10 bg-indigo-700" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">99.9%</p>
              <p>Uptime</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-600">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">GymFlow</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {errors.general && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400 animate-in fade-in duration-200">
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
                className="mt-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors"
              >
                {showPassword ? "Hide password" : "Show password"}
              </button>
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              Sign in
            </Button>

            <p className="text-center text-xs text-gray-400 dark:text-gray-500">
              Default credentials: admin@gymflow.com / admin123
            </p>
          </form>

          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            Powered by{" "}
            <span className="font-medium text-gray-700 dark:text-gray-300">GymFlow</span>
          </p>
        </div>
      </div>
    </div>
  )
}
