import type { Metadata } from "next"
import { getCurrentMember } from "@/lib/member-auth"
import { MemberSidebar } from "@/components/member/member-sidebar"
import { MemberNavbar } from "@/components/member/member-navbar"
import { MemberFooter } from "@/components/member/member-footer"

export const metadata: Metadata = {
  title: {
    template: "%s | GymFlow",
    default: "Dashboard | GymFlow",
  },
}

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
      <a href="#member-main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:text-sm">
        Skip to main content
      </a>
      <MemberSidebar member={member} />
      <div className="flex flex-col flex-1 w-full">
        <MemberNavbar member={member} />
        <main id="member-main-content" className="p-5 lg:p-6 pb-16 lg:pb-6 flex-1">{children}</main>
        <MemberFooter />
      </div>
    </div>
  )
}
