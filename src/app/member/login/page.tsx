"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Dumbbell, Phone, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react"

export default function MemberLoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (!phone || !password) {
      setError("Please enter your phone number and password.")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/member/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Invalid credentials. Please try again.")
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-950 via-purple-900 to-indigo-950 relative overflow-hidden px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-purple-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 rounded-full bg-pink-500/10 blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-[fadeSlideUp_0.6s_ease-out]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center ring-1 ring-white/20">
              <Dumbbell className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">GymFlow</span>
          </div>
          <p className="text-sm text-purple-200/80 font-medium tracking-wide">
            Your Fitness Journey Starts Here
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-8 shadow-2xl ring-1 ring-white/20 border border-white/10">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="h-4 w-4 text-purple-300" />
            <h1 className="text-lg font-semibold text-white">Member Sign In</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5">
                Phone Number
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Phone className="h-4 w-4 text-purple-300 group-focus-within:text-purple-200 transition-colors" />
                </div>
                <div className="absolute inset-y-0 left-9 flex items-center pointer-events-none border-r border-white/20 pr-2.5">
                  <span className="text-sm text-purple-200 font-medium">+91</span>
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                  maxLength={10}
                  className="w-full pl-20 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50 outline-none transition-all duration-200 focus:border-purple-400 focus:bg-white/15 focus:ring-2 focus:ring-purple-400/30"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-purple-200 mb-1.5">
                Password
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                  <Lock className="h-4 w-4 text-purple-300 group-focus-within:text-purple-200 transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-11 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-purple-300/50 outline-none transition-all duration-200 focus:border-purple-400 focus:bg-white/15 focus:ring-2 focus:ring-purple-400/30"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-purple-300 hover:text-purple-200 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/15 border border-red-400/30 rounded-xl px-4 py-2.5 text-sm text-red-200 animate-[fadeSlideUp_0.3s_ease-out]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-400 hover:to-indigo-400 text-white font-semibold rounded-xl transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 shadow-lg shadow-purple-500/25"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center">
            <Link
              href="#"
              className="text-sm text-purple-300 hover:text-purple-200 transition-colors underline underline-offset-2 decoration-purple-400/30 hover:decoration-purple-300/60"
            >
              Forgot Password?
            </Link>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-purple-300/60">
          New here?{" "}
          <Link
            href="/member/signup"
            className="text-purple-200/80 font-medium hover:text-purple-200 transition-colors underline underline-offset-2 decoration-purple-400/30 hover:decoration-purple-300/60"
          >
            Create an Account
          </Link>
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
