"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import { Menu, Sun, Moon, Bell, LogOut, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface Member {
  id: string
  firstName: string
  lastName: string
  email?: string | null
  photo?: string | null
}

interface MemberNavbarProps {
  member: Member
}

const pageTitles: Record<string, string> = {
  "/member/dashboard": "Dashboard",
  "/member/membership": "My Membership",
  "/member/payments": "Payments",
  "/member/attendance": "Attendance",
  "/member/workouts": "Workouts",
  "/member/progress": "Progress",
  "/member/notifications": "Notifications",
  "/member/profile": "Profile",
  "/member/support": "Support",
}

export function MemberNavbar({ member }: MemberNavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { toggleSidebar, theme, setTheme } = useAppStore()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await fetch("/api/member/auth/logout", { method: "POST" })
    router.push("/member/login")
  }

  const pageTitle = pageTitles[pathname] || "Member Portal"

  return (
    <header className="sticky top-0 z-30 h-14 bg-canvas/70 backdrop-blur-xl border-b border-hairline/50">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-[var(--radius-sm)] text-ink-muted hover:bg-surface-1 hover:text-ink lg:hidden transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-ink">{pageTitle}</h1>
            <p className="text-xs text-ink-muted hidden sm:block">
              Welcome back, {member.firstName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-[var(--radius-sm)] text-ink-muted hover:bg-surface-1 hover:text-ink transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            className="relative p-2 rounded-[var(--radius-sm)] text-ink-muted hover:bg-surface-1 hover:text-ink transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-semantic-error text-[8px] font-bold text-white flex items-center justify-center">
              3
            </span>
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-[var(--radius-sm)] hover:bg-surface-1 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center">
                <span className="text-xs font-medium text-ink">
                  {member.firstName.charAt(0)}{member.lastName?.charAt(0) || ""}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-ink-tertiary hidden sm:block" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-[var(--radius-lg)] border border-hairline bg-surface-1 shadow-[var(--shadow-dropdown)] py-1.5 animate-fade-slide-down">
                <div className="px-4 py-3 border-b border-hairline">
                  <p className="text-sm font-semibold text-ink">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {member.email || "Member"}
                  </p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { router.push("/member/profile"); setShowDropdown(false) }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-semantic-error hover:bg-semantic-error/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
