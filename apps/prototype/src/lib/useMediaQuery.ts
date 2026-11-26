import { useSyncExternalStore } from "react";

/** Subscribes to a CSS media query. Falls back to `false` where matchMedia is missing (jsdom). */
export function useMediaQuery(query: string): boolean {
  const get = (): boolean =>
    typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(query).matches
      : false;
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window.matchMedia !== "function") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    get,
    () => false,
  );
}

/** Phone layout (< 600px, docs/ux/README.md breakpoints). */
export const PHONE_QUERY = "(max-width: 599.98px)";
