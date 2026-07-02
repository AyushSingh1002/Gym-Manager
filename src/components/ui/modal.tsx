"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef, useCallback } from "react"
import { X } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl"
}

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function Modal({ open, onClose, title, description, children, className, size = "md" }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  const focusTrap = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab" || !containerRef.current) return

    const focusable = containerRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
    if (focusable.length === 0) {
      e.preventDefault()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault()
        last.focus()
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
  }, [])

  useEffect(() => {
    if (!open) return

    previousFocusRef.current = document.activeElement as HTMLElement

    const timer = setTimeout(() => {
      if (containerRef.current) {
        const firstFocusable = containerRef.current.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
        firstFocusable?.focus()
      }
    }, 50)

    document.addEventListener("keydown", focusTrap)
    document.body.style.overflow = "hidden"

    return () => {
      clearTimeout(timer)
      document.removeEventListener("keydown", focusTrap)
      document.body.style.overflow = "unset"
      previousFocusRef.current?.focus()
    }
  }, [open, focusTrap])

  useEffect(() => {
    if (open) {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose()
      }
      document.addEventListener("keydown", handleEscape)
      return () => document.removeEventListener("keydown", handleEscape)
    }
  }, [open, onClose])

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
          aria-label={title || "Dialog"}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === overlayRef.current && onClose()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            ref={containerRef}
            className={cn(
              "w-full rounded-[var(--radius-xl)] border border-hairline bg-surface-1 p-4 sm:p-6 shadow-[var(--shadow-modal)]",
              sizes[size],
              className
            )}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-hairline gap-4">
              <div className="flex-1 min-w-0">
                {title && <h2 className="text-base sm:text-lg font-semibold text-ink-primary text-balance">{title}</h2>}
                {description && <p className="text-xs sm:text-sm text-ink-tertiary mt-1">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-2 sm:p-2.5 rounded-[var(--radius-sm)] text-ink-tertiary hover:text-ink hover:bg-surface-2 transition-colors flex-shrink-0 min-h-10 min-w-10"
                aria-label="Close modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
