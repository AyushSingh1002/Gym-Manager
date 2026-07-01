import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { getCurrentAdmin } from "@/lib/auth"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"

export const metadata: Metadata = {
  title: {
    template: "%s | GymFlow Admin",
    default: "Dashboard | GymFlow Admin",
  },
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/auth/login")

  return (
    <div className="flex h-screen bg-canvas">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm">
        Skip to main content
      </a>
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar admin={admin} />
        <main id="main-content" className="flex-1 overflow-y-auto p-5 lg:p-6">{children}</main>
      </div>
    </div>
  )
}
