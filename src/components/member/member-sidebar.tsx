"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAppStore } from "@/store/app-store"
import {
  LayoutDashboard,
  CreditCard,
  IndianRupee,
  CalendarCheck,
  Dumbbell,
  BarChart3,
  Bell,
  User,
  LifeBuoy,
  LogOut,
  X,
} from "lucide-react"

interface Member {
  id: string
  firstName: string
  lastName: string
  photo?: string | null
}

interface MemberSidebarProps {
  member: Member
}

const navItems = [
  { href: "/member/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/member/membership", label: "My Membership", icon: CreditCard },
  { href: "/member/payments", label: "Payments", icon: IndianRupee },
  { href: "/member/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/member/workouts", label: "Workouts", icon: Dumbbell },
  { href: "/member/progress", label: "Progress", icon: BarChart3 },
  { href: "/member/notifications", label: "Notifications", icon: Bell },
  { href: "/member/profile", label: "Profile", icon: User },
  { href: "/member/support", label: "Support", icon: LifeBuoy },
]

export function MemberSidebar({ member }: MemberSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { sidebarOpen, setSidebarOpen } = useAppStore()

  const handleSignOut = async () => {
    await fetch("/api/member/auth/logout", { method: "POST" })
    router.push("/member/login")
  }

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
          "fixed top-0 left-0 z-50 w-64 bg-canvas border-r border-hairline flex flex-col transition-transform duration-300 h-full lg:relative lg:h-auto lg:z-auto lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-14 px-5 border-b border-hairline flex-shrink-0">
          <Link href="/member/dashboard" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <div className="w-7 h-7 rounded-[var(--radius-sm)] bg-primary flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-white" />
            </div>
            <span className="text-base font-semibold text-ink">GymFlow</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1 rounded-[var(--radius-sm)] text-ink-tertiary hover:text-ink hover:bg-surface-1 lg:hidden transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            const showBadge = item.label === "Notifications"

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-surface-1 text-ink"
                    : "text-ink-muted hover:bg-surface-1 hover:text-ink"
                )}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span>{item.label}</span>
                {showBadge && (
                  <span className="ml-auto flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-semantic-error text-[10px] font-bold text-white">
                    3
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-hairline flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center text-xs font-medium text-ink">
              {member.firstName.charAt(0)}{member.lastName?.charAt(0) || ""}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-ink truncate">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-xs text-ink-muted">Member</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2 rounded-[var(--radius-sm)] text-sm font-medium text-ink-muted hover:bg-semantic-error/10 hover:text-semantic-error transition-all duration-200"
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
