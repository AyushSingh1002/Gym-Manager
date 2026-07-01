"use client"

import { useRouter } from "next/navigation"
import { ArrowRight, Dumbbell, BarChart3, Users, CreditCard, QrCode, CheckCircle, Zap, TrendingUp } from "lucide-react"
import Link from "next/link"

export default function HomePage() {
  const router = useRouter()

  return (
    <div className="relative min-h-screen bg-canvas text-ink overflow-hidden">
      {/* Animated background - subtle mesh gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/3 rounded-full blur-3xl" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.02]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10">
        {/* Navigation */}
        <nav className="sticky top-0 z-40 border-b border-hairline/30 backdrop-blur-md bg-canvas/80">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-3 group cursor-pointer hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-[var(--radius-lg)] bg-primary/20 ring-1 ring-primary/30 flex items-center justify-center">
                <Dumbbell className="h-4 w-4 text-primary" />
              </div>
              <span className="text-base font-bold text-ink-primary">GymFlow</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm text-ink-tertiary hover:text-ink transition-colors">Features</a>
              <a href="#trust" className="text-sm text-ink-tertiary hover:text-ink transition-colors">Trust</a>
              <a href="#contact" className="text-sm text-ink-tertiary hover:text-ink transition-colors">Contact</a>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => router.push("/member/login")}
                className="hidden sm:inline text-sm text-ink-tertiary hover:text-ink transition-colors px-3 py-2"
              >
                Member Login
              </button>
              <button
                onClick={() => router.push("/auth/login")}
                className="text-sm font-medium text-on-primary bg-primary hover:bg-primary-hover transition-all duration-200 px-4 py-2 rounded-[var(--radius-md)] active:scale-95"
              >
                Admin Login
              </button>
            </div>
          </div>
        </nav>

        {/* Hero - Asymmetric Layout */}
        <section className="pt-20 pb-24 lg:pt-32 lg:pb-40">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Left Content */}
              <div className="flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-hairline/50 text-xs font-medium text-ink-tertiary mb-8 w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-semantic-success animate-pulse" />
                  Trusted by fitness professionals
                </div>

                <h1 className="text-5xl lg:text-6xl font-bold text-ink-primary leading-[1.1] tracking-tight mb-6">
                  Run your entire gym from one beautifully designed platform.
                </h1>

                <p className="text-lg text-ink-tertiary leading-relaxed max-w-lg mb-10">
                  Modern software built for gym owners, personal trainers, and fitness studios. Manage members, memberships, payments, and attendance with unprecedented simplicity.
                </p>

                <div className="flex flex-col sm:flex-row gap-3 mb-12">
                  <button
                    onClick={() => router.push("/auth/login")}
                    className="group flex items-center justify-center gap-2 px-6 py-3.5 rounded-[var(--radius-lg)] bg-primary text-on-primary font-semibold hover:bg-primary-hover transition-all duration-200 hover:scale-105 active:scale-95"
                  >
                    Start Free Trial
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() => router.push("/auth/login")}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-[var(--radius-lg)] border border-hairline hover:border-hairline-strong hover:bg-surface-2 transition-all duration-200 font-medium text-ink"
                  >
                    Explore Demo
                  </button>
                </div>

                <p className="text-sm text-ink-muted">
                  No credit card required. Full access for 14 days.
                </p>
              </div>

              {/* Right Dashboard Mockup */}
              <div className="relative hidden lg:block">
                <div className="relative bg-surface-2 rounded-2xl border border-hairline overflow-hidden shadow-2xl">
                  {/* Mock Dashboard */}
                  <div className="aspect-video flex flex-col">
                    {/* Dashboard Header */}
                    <div className="border-b border-hairline/50 p-4 bg-surface-1">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex gap-2">
                          <div className="w-2 h-2 rounded-full bg-semantic-success" />
                          <div className="w-2 h-2 rounded-full bg-ink-subtle" />
                          <div className="w-2 h-2 rounded-full bg-ink-subtle" />
                        </div>
                        <div className="text-xs text-ink-tertiary">Dashboard</div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-surface-2 rounded-full w-32" />
                        <div className="h-2 bg-surface-3 rounded-full w-48" />
                      </div>
                    </div>

                    {/* Dashboard Content Grid */}
                    <div className="flex-1 p-4 grid grid-cols-2 gap-3 overflow-hidden">
                      {/* Top Left - Revenue */}
                      <div className="bg-surface-3/50 rounded-lg p-3 border border-hairline/30">
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-[10px] text-ink-tertiary font-medium">Revenue</div>
                          <TrendingUp className="w-3 h-3 text-semantic-success" />
                        </div>
                        <div className="text-lg font-bold text-ink-primary mb-1">$12.4K</div>
                        <div className="text-[9px] text-ink-muted">+12% this month</div>
                      </div>

                      {/* Top Right - Members */}
                      <div className="bg-surface-3/50 rounded-lg p-3 border border-hairline/30">
                        <div className="flex items-start justify-between mb-2">
                          <div className="text-[10px] text-ink-tertiary font-medium">Active Members</div>
                          <Users className="w-3 h-3 text-primary" />
                        </div>
                        <div className="text-lg font-bold text-ink-primary mb-1">287</div>
                        <div className="text-[9px] text-ink-muted">+4 new this week</div>
                      </div>

                      {/* Bottom Left - Today's Check-ins */}
                      <div className="bg-surface-3/50 rounded-lg p-3 border border-hairline/30 col-span-2">
                        <div className="text-[10px] text-ink-tertiary font-medium mb-2">Today's Check-ins</div>
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[9px]">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              <span className="text-ink-secondary">45 members</span>
                            </div>
                            <span className="text-ink-muted">9:30 AM</span>
                          </div>
                          <div className="flex items-center justify-between text-[9px]">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-ink-muted" />
                              <span className="text-ink-secondary">Avg duration</span>
                            </div>
                            <span className="text-ink-muted">1.2h</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Floating accent */}
                  <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
                </div>

                {/* Subtle floating animation */}
                <style>{`
                  @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-8px); }
                  }
                  .animate-float-slow {
                    animation: float 6s ease-in-out infinite;
                  }
                `}</style>
              </div>
            </div>
          </div>
        </section>

        {/* Trust Section */}
        <section id="trust" className="border-t border-hairline/30 py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[
                { number: "5,000+", label: "Members Managed", icon: Users },
                { number: "99.9%", label: "Uptime", icon: CheckCircle },
                { number: "50+", label: "Gyms Trust Us", icon: Dumbbell },
                { number: "4.9★", label: "Rating", icon: Zap },
              ].map((stat, i) => (
                <div key={i} className="group">
                  <div className="flex flex-col items-center text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                      <stat.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-3xl lg:text-4xl font-bold text-ink-primary mb-2">{stat.number}</div>
                    <div className="text-sm text-ink-tertiary">{stat.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section - Alternating Layouts */}
        <section id="features" className="py-24 lg:py-32">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 space-y-20 lg:space-y-32">
            {/* Feature 1 - Image Right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h3 className="text-3xl lg:text-4xl font-bold text-ink-primary mb-4 leading-tight">
                  Track attendance effortlessly
                </h3>
                <p className="text-lg text-ink-tertiary mb-8 leading-relaxed max-w-md">
                  QR code check-ins, real-time presence tracking, and automated notifications keep your gym operations running smoothly.
                </p>
                <ul className="space-y-3">
                  {["QR code check-ins", "Real-time analytics", "Automated reminders"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-ink-secondary">
                      <CheckCircle className="w-5 h-5 text-semantic-success flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="hidden lg:block">
                <div className="bg-surface-2 rounded-2xl border border-hairline p-8 aspect-square flex items-center justify-center">
                  <QrCode className="w-24 h-24 text-primary/30" />
                </div>
              </div>
            </div>

            {/* Feature 2 - Image Left */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div className="hidden lg:block order-first lg:order-last">
                <div className="bg-surface-2 rounded-2xl border border-hairline p-8 aspect-square flex items-center justify-center">
                  <CreditCard className="w-24 h-24 text-primary/30" />
                </div>
              </div>
              <div className="lg:order-first">
                <h3 className="text-3xl lg:text-4xl font-bold text-ink-primary mb-4 leading-tight">
                  Payments that scale with you
                </h3>
                <p className="text-lg text-ink-tertiary mb-8 leading-relaxed max-w-md">
                  Accept memberships, manage subscriptions, and process payments securely. Automated billing saves hours every month.
                </p>
                <ul className="space-y-3">
                  {["Automated billing", "Multiple payment methods", "Transparent reporting"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-ink-secondary">
                      <CheckCircle className="w-5 h-5 text-semantic-success flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Feature 3 - Image Right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <h3 className="text-3xl lg:text-4xl font-bold text-ink-primary mb-4 leading-tight">
                  Analytics that matter
                </h3>
                <p className="text-lg text-ink-tertiary mb-8 leading-relaxed max-w-md">
                  Deep insights into member engagement, revenue trends, and business metrics. Make data-driven decisions effortlessly.
                </p>
                <ul className="space-y-3">
                  {["Real-time dashboards", "Export reports", "Predictive insights"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-ink-secondary">
                      <CheckCircle className="w-5 h-5 text-semantic-success flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="hidden lg:block">
                <div className="bg-surface-2 rounded-2xl border border-hairline p-8 aspect-square flex items-center justify-center">
                  <BarChart3 className="w-24 h-24 text-primary/30" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section id="contact" className="py-20 lg:py-32 border-t border-hairline/30">
          <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-4xl lg:text-5xl font-bold text-ink-primary mb-6 leading-tight">
              Ready to modernize your gym?
            </h2>
            <p className="text-lg text-ink-tertiary mb-10 max-w-2xl mx-auto">
              Join 50+ gyms already using GymFlow. Start your 14-day free trial today—no credit card required.
            </p>
            <button
              onClick={() => router.push("/auth/login")}
              className="group inline-flex items-center gap-2 px-8 py-4 rounded-[var(--radius-lg)] bg-primary text-on-primary font-semibold hover:bg-primary-hover transition-all duration-200 hover:scale-105 active:scale-95"
            >
              Get Started Now
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-hairline/30 py-12 mt-20">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-[var(--radius-lg)] bg-primary/20 ring-1 ring-primary/30 flex items-center justify-center">
                    <Dumbbell className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <span className="text-sm font-bold text-ink-primary">GymFlow</span>
                </div>
                <p className="text-xs text-ink-muted">
                  Modern gym management software for fitness professionals.
                </p>
              </div>
              <div className="flex gap-12">
                <div>
                  <h4 className="text-xs font-semibold text-ink-primary mb-3 uppercase tracking-wider">Product</h4>
                  <ul className="space-y-2 text-xs text-ink-tertiary">
                    <li><a href="#features" className="hover:text-ink transition-colors">Features</a></li>
                    <li><a href="/auth/login" className="hover:text-ink transition-colors">Pricing</a></li>
                    <li><a href="/auth/login" className="hover:text-ink transition-colors">Security</a></li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-ink-primary mb-3 uppercase tracking-wider">Legal</h4>
                  <ul className="space-y-2 text-xs text-ink-tertiary">
                    <li><a href="#" className="hover:text-ink transition-colors">Privacy</a></li>
                    <li><a href="#" className="hover:text-ink transition-colors">Terms</a></li>
                    <li><a href="#" className="hover:text-ink transition-colors">Contact</a></li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-hairline/30 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-ink-muted">
              <span>&copy; 2026 GymFlow. All rights reserved.</span>
              <div className="flex gap-6 mt-4 md:mt-0">
                <a href="#" className="hover:text-ink transition-colors">Status</a>
                <a href="#" className="hover:text-ink transition-colors">Support</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
