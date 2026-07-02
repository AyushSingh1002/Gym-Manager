"use client"

import { cn } from "@/lib/utils"
import { InputHTMLAttributes, forwardRef } from "react"

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helpText?: string
  icon?: React.ReactNode
  success?: boolean
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helpText, icon, success, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5 sm:space-y-2">
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
              "block w-full rounded-[var(--radius-md)] border bg-surface-1 px-3 sm:px-3.5 py-2 sm:py-2.5 text-xs sm:text-sm text-ink placeholder-ink-subtle transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-canvas focus:border-primary",
              error 
                ? "border-semantic-error focus:ring-semantic-error/50 focus:border-semantic-error" 
                : success
                ? "border-semantic-success focus:ring-semantic-success/50"
                : "border-hairline-strong focus:ring-primary/50",
              icon && "pl-9 sm:pl-10",
              className
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
            {...props}
          />
        </div>
        {error && <p id={`${id}-error`} className="text-xs sm:text-sm text-semantic-error font-medium">{error}</p>}
        {!error && helpText && <p id={`${id}-help`} className="text-xs sm:text-sm text-ink-tertiary">{helpText}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
