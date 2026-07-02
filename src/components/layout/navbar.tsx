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
    <header className="sticky top-0 z-30 h-16 bg-canvas-secondary/95 backdrop-blur-xl border-b border-hairline shadow-sm">
      <div className="flex items-center justify-between h-full px-3 sm:px-4 lg:px-8">
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSidebar}
            className="p-2.5 min-h-10 min-w-10 rounded-[var(--radius-md)] text-ink-tertiary hover:text-ink hover:bg-surface-2 transition-colors lg:hidden"
            aria-label="Toggle menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2.5 min-h-10 min-w-10 rounded-[var(--radius-md)] text-ink-tertiary hover:text-ink hover:bg-surface-2 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <div className="relative ml-1 sm:ml-2" ref={dropdownRef}>
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className={cn(
                "flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-[var(--radius-md)] transition-colors min-h-10",
                showDropdown ? "bg-surface-2" : "hover:bg-surface-2"
              )}
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30 flex-shrink-0">
                <span className="text-xs font-semibold text-primary">
                  {getInitials(admin.name)}
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="text-left min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-ink-primary leading-tight truncate">{admin.name}</p>
                  <p className="text-[10px] sm:text-xs text-ink-tertiary capitalize truncate">{admin.role.toLowerCase()}</p>
                </div>
                <ChevronDown className={cn(
                  "h-3.5 w-3.5 text-ink-tertiary transition-transform duration-200 flex-shrink-0",
                  showDropdown && "rotate-180"
                )} />
              </div>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 sm:w-56 rounded-[var(--radius-lg)] border border-hairline bg-surface-2 shadow-[var(--shadow-dropdown)] animate-fade-slide-down overflow-hidden">
                <div className="px-3 sm:px-4 py-3 sm:py-3.5 border-b border-hairline">
                  <p className="text-xs sm:text-sm font-semibold text-ink-primary truncate">{admin.name}</p>
                  <p className="text-[10px] sm:text-xs text-ink-tertiary mt-0.5 truncate">{admin.email}</p>
                </div>
                <div className="py-1.5 space-y-0.5">
                  <button
                    onClick={() => { router.push("/settings"); setShowDropdown(false) }}
                    className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-ink-secondary hover:bg-surface-3 hover:text-ink-primary transition-colors min-h-10"
                  >
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 w-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm text-semantic-error hover:bg-semantic-error/10 hover:text-semantic-error-light transition-colors min-h-10"
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
