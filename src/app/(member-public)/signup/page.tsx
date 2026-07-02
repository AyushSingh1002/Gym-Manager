"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Dumbbell, Phone, Lock, ArrowRight, User, Mail } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MemberSignupPage() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [phone, setPhone] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!firstName || !lastName || !phone || !password) {
      setError("Please fill in all required fields.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.")
      return
    }

    if (phone.length < 10) {
      setError("Please enter a valid phone number.")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/member/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, phone, email: email || undefined, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Registration failed. Please try again.")
        return
      }

      router.push("/member/dashboard")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm animate-fade-slide-up">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-[var(--radius-lg)] bg-primary/10 ring-1 ring-primary/20 mb-4">
            <Dumbbell className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-[28px] font-semibold text-ink tracking-tight">GymFlow</h1>
          <p className="text-sm text-ink-muted mt-1">Start your fitness journey today</p>
        </div>

        <div className="border border-hairline rounded-[var(--radius-lg)] bg-surface-1 p-6">
          <h2 className="text-base font-semibold text-ink mb-5">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  First Name <span className="text-semantic-error">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="h-4 w-4 text-ink-tertiary" />
                  </div>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-1 border border-hairline-strong rounded-[var(--radius-md)] text-ink placeholder-ink-tertiary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/30 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1.5">
                  Last Name <span className="text-semantic-error">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <User className="h-4 w-4 text-ink-tertiary" />
                  </div>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-1 border border-hairline-strong rounded-[var(--radius-md)] text-ink placeholder-ink-tertiary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/30 text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Phone Number <span className="text-semantic-error">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Phone className="h-4 w-4 text-ink-tertiary" />
                </div>
                <div className="absolute inset-y-0 left-9 flex items-center pointer-events-none border-r border-hairline-strong pr-2.5">
                  <span className="text-sm text-ink-muted font-medium">+91</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Phone number"
                  maxLength={10}
                  className="w-full pl-[76px] pr-4 py-2.5 bg-surface-1 border border-hairline-strong rounded-[var(--radius-md)] text-ink placeholder-ink-tertiary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Email <span className="text-ink-tertiary">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Mail className="h-4 w-4 text-ink-tertiary" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-1 border border-hairline-strong rounded-[var(--radius-md)] text-ink placeholder-ink-tertiary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Password <span className="text-semantic-error">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-4 w-4 text-ink-tertiary" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-surface-1 border border-hairline-strong rounded-[var(--radius-md)] text-ink placeholder-ink-tertiary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/30 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm text-primary hover:opacity-80 transition-opacity"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">
                Confirm Password <span className="text-semantic-error">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Lock className="h-4 w-4 text-ink-tertiary" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm password"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-1 border border-hairline-strong rounded-[var(--radius-md)] text-ink placeholder-ink-tertiary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
            </div>

            {error && (
              <div className="rounded-[var(--radius-md)] bg-semantic-error/10 border border-semantic-error/20 px-4 py-2.5 text-sm text-semantic-error animate-fade-in">
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Creating account...</span>
                </div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </div>

        <p className="mt-5 text-center text-sm text-ink-muted">
          Already have an account?{" "}
          <Link
            href="/member/login"
            className="text-primary font-medium hover:opacity-80 transition-opacity"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  )
}
