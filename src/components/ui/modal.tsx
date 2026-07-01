"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"
import { X } from "lucide-react"

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

export function Modal({ open, onClose, title, description, children, className, size = "md" }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    if (open) {
      document.addEventListener("keydown", handleEscape)
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.removeEventListener("keydown", handleEscape)
      document.body.style.overflow = "unset"
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => e.target === overlayRef.current && onClose()}
    >
      <div
        className={cn(
          "w-full rounded-[var(--radius-xl)] border border-hairline bg-surface-1 p-6 shadow-[var(--shadow-modal)] animate-scale-in",
          sizes[size],
          className
        )}
      >
        <div className="flex items-start justify-between mb-5">
          <div className="pr-4">
            {title && <h2 className="text-lg font-semibold text-ink">{title}</h2>}
            {description && <p className="text-sm text-ink-muted mt-1">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-[var(--radius-sm)] text-ink-tertiary hover:text-ink hover:bg-surface-2 transition-colors flex-shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
