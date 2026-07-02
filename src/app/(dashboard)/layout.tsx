import { redirect } from "next/navigation"
import { getCurrentAdmin } from "@/lib/auth"
import { Sidebar } from "@/components/layout/sidebar"
import { Navbar } from "@/components/layout/navbar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin()
  if (!admin) redirect("/auth/login")

  return (
    <div className="flex h-screen bg-canvas overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar admin={admin} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
