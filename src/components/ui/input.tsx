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
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-tertiary">
              {icon}
            </div>
          )}
          <input
            id={id}
            ref={ref}
            className={cn(
              "block w-full rounded-[var(--radius-md)] border bg-surface-1 px-3 py-2.5 text-sm text-ink placeholder-ink-tertiary transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary-focus",
              error ? "border-semantic-error focus:ring-semantic-error/30" : "border-hairline-strong",
              icon && "pl-10",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-sm text-semantic-error">{error}</p>}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
