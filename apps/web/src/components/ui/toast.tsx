"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { DURATION, EASE } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type ToastTone = "neutral" | "success" | "warn" | "error" | "info";

export interface Toast {
  id: string;
  title: string;
  description?: string;
  tone?: ToastTone;
  /** ms until auto-dismiss. Default 4500. Pass `Infinity` to persist. */
  duration?: number;
}

interface ToastContextValue {
  toast: (t: Omit<Toast, "id">) => string;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (t: Omit<Toast, "id">) => {
      const id = `toast-${++counterRef.current}`;
      const duration = t.duration ?? 4500;
      setToasts((prev) => [...prev, { ...t, id }]);
      if (duration !== Infinity) {
        setTimeout(() => dismiss(id), duration);
      }
      return id;
    },
    [dismiss],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col gap-2 items-end">
        <AnimatePresence initial={false}>
          {toasts.map((t) => (
            <ToastCard key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

const toneClasses: Record<ToastTone, string> = {
  neutral: "shadow-elev-3",
  success:
    "shadow-[inset_0_0_0_1px_var(--success-line),0_12px_32px_rgba(0,0,0,0.5)]",
  warn:
    "shadow-[inset_0_0_0_1px_var(--warn-line),0_12px_32px_rgba(0,0,0,0.5)]",
  error:
    "shadow-[inset_0_0_0_1px_var(--error-line),0_12px_32px_rgba(0,0,0,0.5)]",
  info: "shadow-[inset_0_0_0_1px_var(--info-line),0_12px_32px_rgba(0,0,0,0.5)]",
};

const toneText: Record<ToastTone, string> = {
  neutral: "text-[var(--fg-1)]",
  success: "text-[var(--success)]",
  warn: "text-[var(--warn)]",
  error: "text-[var(--error)]",
  info: "text-[var(--info)]",
};

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const tone = toast.tone ?? "neutral";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 16, transition: { duration: DURATION.fast, ease: EASE.exit } }}
      transition={{ duration: DURATION.slow, ease: EASE.entrance }}
      className={cn(
        "pointer-events-auto relative min-w-[280px] max-w-[380px] rounded-[14px] bg-[var(--bg-2)] p-4",
        toneClasses[tone],
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className={cn("text-[14px] font-medium leading-tight", toneText[tone])}>
            {toast.title}
          </div>
          {toast.description && (
            <div className="mt-1 text-[13px] leading-[1.55] text-[var(--fg-3)]">
              {toast.description}
            </div>
          )}
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-[var(--fg-4)] hover:text-[var(--fg-2)] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </motion.div>
  );
}
