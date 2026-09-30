"use client";

import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
  duration: number;
}

interface ToastContextValue {
  toast: (input: { title: string; description?: string; variant?: ToastVariant; duration?: number }) => string;
  success: (title: string, description?: string) => string;
  error: (title: string, description?: string) => string;
  info: (title: string, description?: string) => string;
  warning: (title: string, description?: string) => string;
  dismiss: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = React.useState<ToastItem[]>([]);
  const timers = React.useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const toast = React.useCallback<ToastContextValue["toast"]>(
    ({ title, description, variant = "success", duration = 4000 }) => {
      const id = `t_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      setItems((prev) => [...prev.slice(-3), { id, title, description, variant, duration }]);
      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timers.current.set(id, timer);
      }
      return id;
    },
    [dismiss],
  );

  React.useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  const value = React.useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) => toast({ title, description, variant: "success" }),
      error: (title, description) => toast({ title, description, variant: "error" }),
      info: (title, description) => toast({ title, description, variant: "info" }),
      warning: (title, description) => toast({ title, description, variant: "warning" }),
      dismiss,
    }),
    [toast, dismiss],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const VARIANT_STYLES: Record<ToastVariant, { icon: React.ElementType; className: string; iconClass: string }> = {
  success: { icon: CheckCircle2, className: "border-success/30 bg-card", iconClass: "text-success" },
  error: { icon: XCircle, className: "border-destructive/30 bg-card", iconClass: "text-destructive" },
  info: { icon: Info, className: "border-info/30 bg-card", iconClass: "text-info" },
  warning: { icon: AlertTriangle, className: "border-warning/40 bg-card", iconClass: "text-warning" },
};

function ToastViewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: string) => void }) {
  return (
    <div
      role="region"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:bottom-auto sm:top-0 sm:items-end"
    >
      {items.map((item) => {
        const conf = VARIANT_STYLES[item.variant];
        const Icon = conf.icon;
        return (
          <div
            key={item.id}
            role="status"
            aria-live="polite"
            className={cn(
              "animate-in fade-in slide-in-from-bottom-2 pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border p-3.5 shadow-pop sm:slide-in-from-top-2",
              conf.className,
            )}
          >
            <Icon className={cn("mt-0.5 size-5 shrink-0", conf.iconClass)} />
            <div className="min-w-0 flex-1">
              <p className="text-sm leading-snug font-semibold">{item.title}</p>
              {item.description && <p className="text-muted-foreground mt-0.5 text-[13px] leading-snug">{item.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(item.id)}
              className="text-muted-foreground hover:text-foreground focus-visible:ring-ring -mr-1 rounded p-1 transition focus-visible:ring-2 focus-visible:outline-none"
            >
              <X className="size-4" />
              <span className="sr-only">Dismiss</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
