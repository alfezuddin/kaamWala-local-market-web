"use client";

import * as React from "react";

/** No-op subscription: hydration state only changes once, on mount. */
const subscribe = () => () => {};

/**
 * Client-only readiness flag. The mock database lives in localStorage, so the
 * first client render must be a skeleton to keep server and client markup equal.
 * `useSyncExternalStore` gives us the server value during SSR and the client
 * value on hydration without an extra render pass.
 */
export function useMounted() {
  return React.useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

/** Re-renders when the mock database is mutated from anywhere in the app. */
export function useDbVersion() {
  const [version, setVersion] = React.useState(0);
  React.useEffect(() => {
    const handler = () => setVersion((v) => v + 1);
    window.addEventListener("kaamwala:db-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("kaamwala:db-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);
  return version;
}
