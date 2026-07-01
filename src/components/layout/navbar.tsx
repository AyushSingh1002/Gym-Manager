"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAppStore } from "@/store/app-store"
import { Menu, Sun, Moon, LogOut, ChevronDown } from "lucide-react"
import { cn, getInitials } from "@/lib/utils"

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  avatar?: string | null
}

interface NavbarProps {
  admin: AdminUser
}

export function Navbar({ admin }: NavbarProps) {
  const router = useRouter()
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

  const handleLogout = async () => {
    await fetch("/api/auth/me", { method: "DELETE" })
    router.push("/auth/login")
  }

  return (
    <header className="sticky top-0 z-30 h-14 bg-canvas/80 backdrop-blur-md border-b border-hairline">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-[var(--radius-sm)] text-ink-muted hover:bg-surface-1 hover:text-ink lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-[var(--radius-sm)] text-ink-muted hover:bg-surface-1 hover:text-ink transition-colors"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 p-1.5 rounded-[var(--radius-sm)] hover:bg-surface-1 transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-surface-2 flex items-center justify-center">
                <span className="text-xs font-medium text-ink">
                  {getInitials(admin.name)}
                </span>
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-ink">{admin.name}</p>
                <p className="text-xs text-ink-muted capitalize">{admin.role.toLowerCase()}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-ink-tertiary" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 rounded-[var(--radius-lg)] border border-hairline bg-surface-1 shadow-[var(--shadow-dropdown)] py-1 animate-fade-slide-down">
                <div className="px-4 py-2.5 border-b border-hairline">
                  <p className="text-sm font-medium text-ink">{admin.name}</p>
                  <p className="text-xs text-ink-muted">{admin.email}</p>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => { router.push("/settings"); setShowDropdown(false) }}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-ink-muted hover:bg-surface-2 hover:text-ink transition-colors"
                  >
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-4 py-2 text-sm text-semantic-error hover:bg-semantic-error/10 transition-colors"
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
