"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"
import {
  LayoutDashboard,
  Users,
  CreditCard,
  CalendarCheck,
  IndianRupee,
  BarChart3,
  History,
  Settings,
  Dumbbell,
  X,
} from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Members", icon: Users },
  { href: "/memberships", label: "Memberships", icon: CreditCard },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/payments", label: "Payments", icon: IndianRupee },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/activity-log", label: "Activity Log", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  return (
    <>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-canvas-secondary border-r border-hairline flex flex-col transition-transform duration-250 lg:translate-x-0 lg:static lg:z-auto pl-[env(safe-area-inset-left)]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-hairline flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3 group hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-[var(--radius-md)] bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-sm">
              <Dumbbell className="h-4 w-4 text-white" />
            </div>
            <div>
              <span className="text-base font-bold text-ink-primary block leading-tight">GymFlow</span>
              <span className="text-xs text-ink-subtle">Pro</span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="p-1.5 rounded-[var(--radius-sm)] text-ink-tertiary hover:text-ink hover:bg-surface-2 transition-colors lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 pb-[env(safe-area-inset-bottom)]">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-3 rounded-[var(--radius-md)] text-sm font-medium transition-all duration-150 min-h-12",
                  isActive
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-ink-tertiary hover:bg-surface-2 hover:text-ink-secondary border border-transparent"
                )}
              >
                <item.icon className={cn(
                  "h-4 w-4 flex-shrink-0",
                  isActive ? "text-primary" : ""
                )} />
                <span className="flex-1">{item.label}</span>
                {isActive && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                )}
              </Link>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
