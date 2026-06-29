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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        getStatusColor(status),
        className
      )}
    >
      {children || status}
    </span>
  )
}
