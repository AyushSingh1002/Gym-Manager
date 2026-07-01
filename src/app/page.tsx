"use client"

import { useRouter } from "next/navigation"
import { ArrowRight, Dumbbell } from "lucide-react"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="relative min-h-screen bg-canvas overflow-hidden flex flex-col">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover opacity-40"
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23010102' width='100' height='100'/%3E%3C/svg%3E"
      >
        <source src="https://videos.ctfassets.net/rzqtw1l5y3w2/6Q82aY4FkREq0WDh5G5x2e/fcb9b1a10465c1a4b1a84d9b03cea57a/Gym_-_34745.mp4" type="video/mp4" />
      </video>

      <div className="absolute inset-0 bg-gradient-to-t from-canvas via-canvas/60 to-canvas/30" />

      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[var(--radius-sm)] bg-primary/20 ring-1 ring-primary/30 flex items-center justify-center">
            <Dumbbell className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-semibold text-ink">GymFlow</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/member/login")}
            className="text-sm text-ink-muted hover:text-ink transition-colors px-3 py-2"
          >
            Member Login
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-sm font-medium text-on-primary bg-primary hover:bg-primary-hover transition-colors px-4 py-2 rounded-[var(--radius-md)]"
          >
            Admin Login
          </button>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 max-w-7xl mx-auto w-full">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill border border-hairline text-xs font-medium text-ink-muted mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-semantic-success" />
            Gym management, reimagined
          </div>

          <h1 className="font-['Inter'] font-semibold text-ink text-[clamp(2.5rem,8vw,5.5rem)] leading-[1.08] tracking-[-0.03em]">
            NEW ERA OF{" "}
            <span className="text-primary">DESIGN</span>
            <br />
            STARTS NOW
          </h1>

          <p className="mt-6 text-lg text-ink-muted max-w-xl leading-relaxed">
            Streamline your gym operations with a modern, beautiful management platform built for
            small to medium-sized fitness studios.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-start gap-4">
            <button
              onClick={() => router.push("/member/signup")}
              className="group inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-md)] bg-primary text-on-primary font-medium text-sm hover:bg-primary-hover transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              Get Started
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>

            <button
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-[var(--radius-md)] border border-hairline text-ink-muted font-medium text-sm hover:bg-surface-2 hover:text-ink transition-all duration-300"
            >
              Admin Dashboard
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 border-t border-hairline">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-ink-tertiary">
          <span>&copy; 2026 GymFlow. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </div>
  )
}
