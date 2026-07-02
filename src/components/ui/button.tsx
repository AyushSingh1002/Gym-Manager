"use client"

import { cn } from "@/lib/utils"
import { ButtonHTMLAttributes, forwardRef } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline" | "success"
  size?: "sm" | "md" | "lg" | "xl"
  loading?: boolean
  fullWidth?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", loading, disabled, children, fullWidth, ...props }, ref) => {
    const variants = {
      primary:
        "bg-primary text-on-primary hover:bg-primary-hover active:bg-primary-active focus:ring-primary/50 shadow-sm hover:shadow-card",
      secondary:
        "bg-surface-2 text-ink border border-hairline-strong hover:bg-surface-3 hover:border-hairline focus:ring-primary/50",
      ghost:
        "text-ink-tertiary hover:text-ink hover:bg-surface-2",
      danger:
        "bg-semantic-error text-white hover:bg-semantic-error-light active:bg-semantic-error focus:ring-semantic-error/50 shadow-sm hover:shadow-card",
      outline:
        "border border-hairline-strong bg-surface-1 text-ink hover:bg-surface-2 hover:border-hairline focus:ring-primary/50",
      success:
        "bg-semantic-success text-white hover:bg-semantic-success-light active:bg-semantic-success focus:ring-semantic-success/50 shadow-sm hover:shadow-card",
    }
    const sizes = {
      sm: "px-3 py-1.5 text-xs h-8 sm:h-9 gap-1.5 min-w-10 sm:min-w-10",
      md: "px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm h-10 sm:h-11 gap-2 min-h-10",
      lg: "px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base h-11 sm:h-12 gap-2 min-h-11",
      xl: "px-5 sm:px-6 py-3 sm:py-3.5 text-base sm:text-lg h-12 sm:h-14 gap-2.5 min-h-12",
    }

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150",
          "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-offset-canvas",
          "disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none",
          "active:scale-[0.98]",
          "rounded-[var(--radius-md)]",
          variants[variant],
          sizes[size],
          fullWidth && "w-full",
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4 flex-shrink-0" viewBox="0 0 24 24">
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
