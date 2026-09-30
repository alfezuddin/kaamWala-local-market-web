"use client";

import * as React from "react";
import { useMounted } from "@/hooks/use-mounted";

type Theme = "light" | "dark" | "system";
type Resolved = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: Resolved;
  setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = "kaamwala.theme";
const THEME_EVENT = "kaamwala:theme-changed";
const ThemeContext = React.createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  setTheme: () => undefined,
});

function isTheme(value: unknown): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function subscribeToTheme(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

let cachedRaw: string | null = null;
let cachedTheme: Theme = "system";

function getThemeSnapshot(): Theme {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedTheme = isTheme(raw) ? raw : "system";
  }
  return cachedTheme;
}

function getServerTheme(): Theme {
  return "system";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = React.useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerTheme);
  const [systemResolved, setSystemResolved] = React.useState<Resolved>("light");
  const mounted = useMounted();

  const resolvedTheme: Resolved = theme === "system" ? systemResolved : theme;

  const apply = React.useCallback((next: Resolved) => {
    const root = document.documentElement;
    root.classList.toggle("dark", next === "dark");
    root.style.colorScheme = next;
  }, []);

  // Track the OS preference for `system`, and keep the DOM in sync with the
  // resolved theme. These effects only touch the outside world.
  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setSystemResolved(media.matches ? "dark" : "light");
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;
    apply(resolvedTheme);
  }, [apply, mounted, resolvedTheme]);

  const setTheme = React.useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  const value = React.useMemo(() => ({ theme, resolvedTheme, setTheme }), [theme, resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      <script
        // Applies the persisted theme before paint to avoid a flash of the wrong theme.
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`,
        }}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return React.useContext(ThemeContext);
}
