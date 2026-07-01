"use client"

import { cn } from "@/lib/utils"
import { HTMLAttributes, forwardRef } from "react"

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-[var(--radius-lg)] border border-hairline bg-surface-1 p-5",
          hover && "transition-all duration-200 hover:bg-surface-2 hover:border-hairline-strong",
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
    <div className={cn("flex items-center justify-between mb-4", className)}>
      {children || (
        <div>
          {title && <h3 className="text-[15px] font-semibold text-ink">{title}</h3>}
          {description && <p className="text-sm text-ink-muted mt-0.5">{description}</p>}
        </div>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("", className)} {...props} />
}

export { Card, CardHeader, CardContent }
