"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DURATION, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  /** Dialog title (optional — omit for layouts that own the header). */
  title?: string;
  /** Short description under the title. */
  description?: string;
  children: ReactNode;
  /** Max width in px or tailwind-token form — defaults to 520. */
  maxWidth?: number | string;
  className?: string;
}

/**
 * Dialog — modal sheet. Backdrop click closes. Escape closes.
 * Sized for forms and confirmations, not full-page takeovers.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  maxWidth = 520,
  className,
}: DialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    // lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.fast, ease: EASE.standard }}
        >
          <motion.button
            aria-label="Close dialog"
            className="absolute inset-0 bg-black/60 backdrop-blur-[8px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATION.fast }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "dialog-title" : undefined}
            className={cn(
              "relative w-full rounded-[20px] bg-[var(--bg-2)] shadow-elev-4",
              "p-6",
              className,
            )}
            style={{ maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth }}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: DURATION.base, ease: EASE.entrance }}
          >
            {(title || description) && (
              <header className="mb-4">
                {title && (
                  <h2
                    id="dialog-title"
                    className="text-[20px] font-medium leading-tight tracking-[-0.01em] text-[var(--fg-1)]"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="mt-2 text-[14px] leading-[1.55] text-[var(--fg-3)]">
                    {description}
                  </p>
                )}
              </header>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
