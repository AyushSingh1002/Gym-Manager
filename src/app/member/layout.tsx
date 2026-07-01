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
      <div className="min-h-screen bg-canvas">
        <main>{children}</main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-canvas flex">
      <MemberSidebar member={member} />
      <div className="flex flex-col flex-1 w-full">
        <MemberNavbar member={member} />
        <main className="p-5 lg:p-6 pb-16 lg:pb-6 flex-1">{children}</main>
        <MemberFooter />
      </div>
    </div>
  )
}
