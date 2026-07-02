"use client"

import { cn } from "@/lib/utils"
import { InputHTMLAttributes, forwardRef } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    return (
      <div className="space-y-2 sm:space-y-2.5">
        {label && (
          <label htmlFor={id} className="block text-xs sm:text-sm font-medium text-ink-primary">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-ink-tertiary flex-shrink-0">
              {icon}
            </div>
          )}
          <input
            id={id}
            ref={ref}
            className={cn(
              "block w-full rounded-[var(--radius-md)] border bg-surface-1 px-3 sm:px-3.5 py-2.5 sm:py-3 text-sm sm:text-base text-ink placeholder-ink-subtle transition-all duration-150 min-h-10 sm:min-h-11",
              "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-offset-canvas focus:border-primary",
              error 
                ? "border-semantic-error focus:ring-semantic-error/50 focus:border-semantic-error" 
                : "border-hairline-strong focus:ring-primary/50",
              icon && "pl-9 sm:pl-10",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs sm:text-sm text-semantic-error font-medium">{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
