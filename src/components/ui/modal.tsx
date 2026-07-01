"use client"

import { cn } from "@/lib/utils"
import { useEffect, useRef } from "react"
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
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={(e) => e.target === overlayRef.current && onClose()}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className={cn(
              "w-full rounded-[var(--radius-xl)] border border-hairline bg-surface-1 p-6 shadow-[var(--shadow-modal)]",
              sizes[size],
              className
            )}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <div className="flex items-start justify-between mb-6 pb-4 border-b border-hairline">
              <div className="flex-1 pr-4">
                {title && <h2 className="text-lg font-semibold text-ink-primary">{title}</h2>}
                {description && <p className="text-sm text-ink-tertiary mt-1">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-[var(--radius-sm)] text-ink-tertiary hover:text-ink hover:bg-surface-2 transition-colors flex-shrink-0"
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
