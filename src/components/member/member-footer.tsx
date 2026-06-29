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
    <footer className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-gray-950/80 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-800/50 px-4 py-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          &copy; 2024 GymFlow. All rights reserved.
        </p>
        <div className="flex items-center gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-xs text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
