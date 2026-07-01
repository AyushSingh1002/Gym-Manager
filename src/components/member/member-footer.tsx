"use client"

import Link from "next/link"

const quickLinks = [
  { href: "/member/support", label: "Support" },
  { href: "/member/profile", label: "Settings" },
  { href: "#", label: "Privacy" },
  { href: "#", label: "Terms" },
]

export function MemberFooter() {
  return (
    <footer className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-canvas/80 backdrop-blur-xl border-t border-hairline/50 px-4 py-2.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-ink-muted">
          &copy; 2024 GymFlow.
        </p>
        <div className="flex items-center gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs text-ink-muted hover:text-ink transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
