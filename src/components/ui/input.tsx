"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  /** Optional leading adornment, e.g. a Lucide icon. */
  icon?: React.ReactNode;
  /** Optional trailing adornment, e.g. a reveal-password button. */
  trailing?: React.ReactNode;
};

const baseInput =
  "flex w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground shadow-soft transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 read-only:opacity-70 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20";

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, icon, trailing, ...props }, ref) => {
    const input = (
      <input type={type} ref={ref} className={cn(baseInput, "h-10", icon && "pl-9", trailing && "pr-10", className)} {...props} />
    );

    if (!icon && !trailing) return input;

    return (
      <div className="relative">
        {icon && (
          <span className="text-muted-foreground pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 [&>svg]:size-4">
            {icon}
          </span>
        )}
        {input}
        {trailing && <span className="absolute right-2 top-1/2 -translate-y-1/2">{trailing}</span>}
      </div>
    );
  },
);
Input.displayName = "Input";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(baseInput, "min-h-24 resize-y", className)} {...props} />
  ),
);
Textarea.displayName = "Textarea";

export { Input, Textarea, baseInput };
