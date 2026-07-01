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
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-ink">
            {label}
          </label>
        )}
        <select
          id={id}
          ref={ref}
          className={cn(
            "block w-full rounded-[var(--radius-md)] border bg-surface-1 px-3 py-2.5 text-sm text-ink transition-all duration-200",
            "focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary-focus",
            error ? "border-semantic-error" : "border-hairline-strong",
            className
          )}
          {...props}
        >
          {placeholder && <option value="" className="text-ink-tertiary">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-sm text-semantic-error">{error}</p>}
      </div>
    )
  }
)
Select.displayName = "Select"

export { Select }
