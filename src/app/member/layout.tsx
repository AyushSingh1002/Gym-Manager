import { getCurrentMember } from "@/lib/member-auth"
import { MemberSidebar } from "@/components/member/member-sidebar"
import { MemberNavbar } from "@/components/member/member-navbar"
import { MemberFooter } from "@/components/member/member-footer"

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const member = await getCurrentMember()

  if (!member) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <MemberSidebar member={member} />
      <div className="lg:pl-64 transition-all duration-300">
        <MemberNavbar member={member} />
        <main className="p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
        <MemberFooter />
      </div>
    </div>
  )
}
