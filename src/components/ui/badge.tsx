"use client"

import { cn, getStatusColor } from "@/lib/utils"

interface BadgeProps {
  status: string
  className?: string
  children?: React.ReactNode
}

export function Badge({ status, className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        getStatusColor(status),
        className
      )}
    >
      {children || status}
    </span>
  )
}
