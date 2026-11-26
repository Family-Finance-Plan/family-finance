/**
 * Display preferences (docs/ux/settings.md). Per device, not per household: they live in
 * localStorage and on the <html> element as data attributes that styles.css reads.
 * Storage may be missing or blocked (private window); the defaults then apply.
 */
import { useSyncExternalStore } from "react";

export type Theme = "system" | "light" | "dark";
export type TextSize = "sm" | "md" | "lg" | "xl";
export type Density = "comfortable" | "compact";
export type Motion = "system" | "reduce";
export type StartPage = "/" | "/transactions" | "/upload";

export interface Preferences {
  theme: Theme;
  textSize: TextSize;
  density: Density;
  motion: Motion;
  startPage: StartPage;
}

export const DEFAULT_PREFERENCES: Preferences = {
  theme: "system",
  textSize: "md",
  density: "comfortable",
  motion: "system",
  startPage: "/",
};

export const THEMES: readonly Theme[] = ["system", "light", "dark"];
export const TEXT_SIZES: readonly TextSize[] = ["sm", "md", "lg", "xl"];
export const DENSITIES: readonly Density[] = ["comfortable", "compact"];
export const MOTIONS: readonly Motion[] = ["system", "reduce"];
export const START_PAGES: readonly StartPage[] = [
  "/",
  "/transactions",
  "/upload",
];

const STORAGE_KEY = "ff-proto-preferences";

function pick<T>(allowed: readonly T[], value: unknown, fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback;
}

/** Keeps only known values, so a stale or edited entry can't break the page. */
export function sanitize(raw: unknown): Preferences {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<
    string,
    unknown
  >;
  const d = DEFAULT_PREFERENCES;
  return {
    theme: pick(THEMES, r.theme, d.theme),
    textSize: pick(TEXT_SIZES, r.textSize, d.textSize),
    density: pick(DENSITIES, r.density, d.density),
    motion: pick(MOTIONS, r.motion, d.motion),
    startPage: pick(START_PAGES, r.startPage, d.startPage),
  };
}

function load(): Preferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

let current: Preferences =
  typeof window === "undefined" ? DEFAULT_PREFERENCES : load();
const listeners = new Set<() => void>();

/** Writes the preferences onto <html>. Defaults remove the attribute to keep the DOM clean. */
export function applyPreferences(
  p: Preferences,
  root: HTMLElement = document.documentElement,
): void {
  const set = (name: string, value: string, isDefault: boolean) =>
    isDefault ? root.removeAttribute(name) : root.setAttribute(name, value);
  set("data-theme", p.theme, p.theme === "system");
  set("data-text-size", p.textSize, p.textSize === "md");
  set("data-density", p.density, p.density === "comfortable");
  set("data-motion", p.motion, p.motion === "system");
}

export function getPreferences(): Preferences {
  return current;
}

export function setPreferences(change: Partial<Preferences>): void {
  current = sanitize({ ...current, ...change });
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Not saved on this device; the choice still applies until the page reloads.
  }
  applyPreferences(current);
  listeners.forEach((l) => l());
}

export function resetPreferences(): void {
  setPreferences(DEFAULT_PREFERENCES);
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    getPreferences,
    () => DEFAULT_PREFERENCES,
  );
}
