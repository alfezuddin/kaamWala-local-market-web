"use client";

import * as React from "react";
import Link from "next/link";
import { useTheme } from "@/components/providers/theme-provider";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { DynamicIcon } from "@/components/ui/dynamic-icon";

export function AppLogo({
  href = "/",
  showText = true,
  size = "md",
  className,
  inverted,
}: {
  href?: string | null;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  inverted?: boolean;
}) {
  const dim = { sm: "size-8", md: "size-9", lg: "size-11" }[size];
  const text = { sm: "text-base", md: "text-lg", lg: "text-xl" }[size];
  const content = (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-soft",
          dim,
        )}
      >
        <DynamicIcon name="Hammer" className="size-[55%]" />
      </span>
      {showText && (
        <span className={cn("font-bold tracking-tight", text, inverted && "text-white")}>
          Kaam<span className="text-primary">Wala</span>
        </span>
      )}
    </span>
  );
  if (!href) return content;
  return (
    <Link href={href} className="focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none">
      {content}
    </Link>
  );
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      className={className}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
    >
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
