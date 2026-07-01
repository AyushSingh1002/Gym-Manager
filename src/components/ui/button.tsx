"use client"

import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes, forwardRef } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline"
  size?: "sm" | "md" | "lg"
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, ...props }, ref) => {
    const variants = {
      primary:
        "bg-primary text-white hover:bg-primary-hover focus:ring-primary/50",
      secondary:
        "bg-surface-1 text-ink border border-hairline hover:bg-surface-2",
      ghost:
        "text-ink-muted hover:text-ink hover:bg-surface-1",
      danger:
        "bg-semantic-error text-white hover:bg-semantic-error/90",
      outline:
        "border border-hairline-strong bg-surface-1 text-ink hover:bg-surface-2",
    }
    const sizes = {
      sm: "px-3 py-1.5 text-sm h-8",
      md: "px-4 py-2 text-sm h-10",
      lg: "px-6 py-2.5 text-base h-11",
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]",
          "rounded-[var(--radius-md)]",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
