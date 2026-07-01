"use client"

import { cn } from "@/lib/utils"
import { HTMLAttributes, forwardRef } from "react"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  interactive?: boolean
  variant?: "default" | "elevated" | "outlined"
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover, interactive, variant = "default", children, ...props }, ref) => {
    const variants = {
      default: "border border-hairline bg-surface-1 shadow-card",
      elevated: "border border-hairline bg-surface-2 shadow-card hover:shadow-card-hover",
      outlined: "border border-hairline-strong bg-surface-1",
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-lg)] p-6 transition-all duration-150",
          variants[variant],
          hover && "hover:bg-surface-2 hover:border-hairline-strong",
          interactive && "cursor-pointer hover:bg-surface-2 hover:shadow-card-hover active:scale-[0.99]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = "Card"

interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  action?: React.ReactNode
}

function CardHeader({ className, title, description, action, children }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between mb-6 pb-4 border-b border-hairline", className)}>
      {children || (
        <div className="flex-1">
          {title && <h3 className="text-base font-semibold text-ink-primary">{title}</h3>}
          {description && <p className="text-sm text-ink-tertiary mt-1">{description}</p>}
        </div>
      )}
      {action && <div className="ml-4 flex-shrink-0">{action}</div>}
    </div>
  )
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />
}

export { Card, CardHeader, CardContent }
