"use client"

import { cn, getStatusColor } from "@/lib/utils"

interface BadgeProps {
  status?: string
  variant?: "default" | "success" | "error" | "warning" | "info"
  className?: string
  children?: React.ReactNode
}

export function Badge({ status, variant, className, children }: BadgeProps) {
  const variantStyles = {
    default: "bg-surface-2 text-ink-secondary",
    success: "bg-semantic-success/10 text-semantic-success-light",
    error: "bg-semantic-error/10 text-semantic-error-light",
    warning: "bg-semantic-warning/10 text-semantic-warning",
    info: "bg-semantic-info/10 text-semantic-info",
  }
  
  const styles = variant 
    ? variantStyles[variant] 
    : getStatusColor(status || "")
  
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
        styles,
        className
      )}
    >
      {children || status}
    </span>
  )
}
