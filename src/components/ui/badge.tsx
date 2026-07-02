"use client"

import { cn, getStatusColor } from "@/lib/utils"

interface BadgeProps {
  status?: string
  variant?: "default" | "success" | "error" | "warning" | "info" | "primary"
  size?: "sm" | "md" | "lg"
  className?: string
  children?: React.ReactNode
  icon?: React.ReactNode
}

export function Badge({ status, variant, size = "md", className, children, icon }: BadgeProps) {
  const variantStyles = {
    default: "bg-surface-2 text-ink-secondary",
    primary: "bg-primary/10 text-primary",
    success: "bg-semantic-success/10 text-semantic-success-light",
    error: "bg-semantic-error/10 text-semantic-error-light",
    warning: "bg-semantic-warning/10 text-semantic-warning",
    info: "bg-semantic-info/10 text-semantic-info",
  }
  
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
    lg: "px-3 py-1.5 text-sm",
  }
  
  const styles = variant 
    ? variantStyles[variant] 
    : getStatusColor(status || "")
  
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium transition-colors",
        sizeStyles[size],
        styles,
        className
      )}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      {children || status}
    </span>
  )
}
