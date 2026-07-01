"use client"

import { cn } from "@/lib/utils"
import { SelectHTMLAttributes, forwardRef } from "react"

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, id, ...props }, ref) => {
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-ink-primary">
            {label}
          </label>
        )}
        <select
          id={id}
          ref={ref}
          className={cn(
            "block w-full rounded-[var(--radius-md)] border bg-surface-1 px-3.5 py-2.5 text-sm text-ink transition-all duration-150",
            "focus:outline-none focus:ring-2 focus:ring-offset-0 focus:ring-offset-canvas focus:border-primary",
            "appearance-none cursor-pointer",
            error 
              ? "border-semantic-error focus:ring-semantic-error/50 focus:border-semantic-error" 
              : "border-hairline-strong focus:ring-primary/50",
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-semantic-error font-medium">{error}</p>}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
