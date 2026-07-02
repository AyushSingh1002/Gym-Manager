"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import { Menu, Bell, LogOut, ChevronDown } from "lucide-react"
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
  const { toggleSidebar } = useAppStore()
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
    <header className="sticky top-0 z-30 h-16 bg-canvas-secondary/95 backdrop-blur-xl border-b border-hairline shadow-sm">
      <div className="flex items-center justify-between h-full px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-[var(--radius-md)] text-ink-tertiary hover:text-ink hover:bg-surface-2 transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold text-ink-primary">{pageTitle}</h1>
            <p className="text-xs text-ink-tertiary">
              Welcome back, {member.firstName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            className="relative p-2 rounded-[var(--radius-md)] text-ink-tertiary hover:text-ink hover:bg-surface-2 transition-colors"
            aria-label="Notifications"
            onClick={() => router.push("/member/notifications")}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-3 h-3 rounded-full bg-semantic-error text-[7px] font-bold text-white flex items-center justify-center">
              3
            </span>
          </button>

          <div className="relative ml-2" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-[var(--radius-md)] transition-colors",
                showDropdown ? "bg-surface-2" : "hover:bg-surface-2"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 flex-shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {member.firstName.charAt(0)}{member.lastName?.charAt(0) || ""}
                </span>
              </div>
              <ChevronDown className={cn(
                "h-3.5 w-3.5 text-ink-tertiary transition-transform duration-200 hidden sm:block",
                showDropdown && "rotate-180"
              )} />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-[var(--radius-lg)] border border-hairline bg-surface-2 shadow-[var(--shadow-dropdown)] animate-fade-slide-down overflow-hidden">
                <div className="px-4 py-3.5 border-b border-hairline">
                  <p className="text-sm font-semibold text-ink-primary">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-xs text-ink-tertiary mt-0.5">
                    {member.email || "Member Account"}
                  </p>
                </div>
                <div className="py-1.5 space-y-0.5">
                  <button
                    onClick={() => { router.push("/member/profile"); setShowDropdown(false) }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-ink-secondary hover:bg-surface-3 hover:text-ink-primary transition-colors"
                  >
                    My Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-semantic-error hover:bg-semantic-error/10 hover:text-semantic-error-light transition-colors"
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
