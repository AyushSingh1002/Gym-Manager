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
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-gray-200 dark:bg-gray-950 dark:border-gray-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <Link href="/member/dashboard" className="flex items-center gap-2.5" onClick={() => setSidebarOpen(false)}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-sm">
              <Dumbbell className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">GymFlow</span>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-gray-800 lg:hidden transition-colors"
          >
            <X className="h-5 w-5" />
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
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-gradient-to-r from-purple-50 to-indigo-50 text-purple-700 dark:from-purple-500/10 dark:to-indigo-500/10 dark:text-purple-400 shadow-sm"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800/60 dark:hover:text-gray-100"
                )}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")} />
                <span>{item.label}</span>
                {showBadge && (
                  <span className="ml-auto flex-shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-500 text-[10px] font-bold text-white">
                    3
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
              {member.firstName.charAt(0)}{member.lastName?.charAt(0) || ""}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Member</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  )
}
