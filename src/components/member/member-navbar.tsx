"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import { Menu, Sun, Moon, Search, Bell, LogOut, User, ChevronDown } from "lucide-react"
import { cn, getInitials } from "@/lib/utils"

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
    <header className="sticky top-0 z-30 h-16 bg-white/70 dark:bg-gray-950/70 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300 lg:hidden transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{pageTitle}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block">
              Welcome back, {member.firstName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-56 pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:w-64 focus:border-indigo-300 focus:ring-2 focus:ring-indigo-500/20 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-100 dark:placeholder-gray-500 dark:focus:border-indigo-500"
            />
          </div>

          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button
            className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center">
              3
            </span>
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {getInitials(member.firstName, member.lastName)}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 hidden sm:block" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-gray-200/50 bg-white shadow-xl py-1.5 dark:border-gray-700/50 dark:bg-gray-900 animate-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {member.firstName} {member.lastName}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {member.email || "Member"}
                  </p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { router.push("/member/profile"); setShowDropdown(false) }}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors"
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
