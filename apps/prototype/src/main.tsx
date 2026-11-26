import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { applyPreferences, getPreferences } from "./lib/preferences";
import { createInitialState, type Session } from "./state/store";
import "./styles.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root element");
}

/**
 * Prototype-only review shortcut: `?as=parent-a` or `?as=parent-b` (before the `#`) starts
 * signed in, so a deep link like `/?as=parent-a#/transactions` opens directly. Demo users only.
 *
 * PROTOTYPE ONLY. Never carry this into apps/web: in the real app the user and the tenant come
 * from the authenticated session only, never from a URL or browser parameter (R-003, ADR-001/002).
 */
function sessionFromSearch(): Session | null {
  const as = new URLSearchParams(window.location.search).get("as");
  if (as === "parent-a")
    return { userId: "u-parent-a", householdId: "hh-demo" };
  if (as === "parent-b")
    return { userId: "u-parent-b", householdId: "hh-demo" };
  return null;
}

// Apply saved display settings before the first render, so the page never flashes the wrong theme.
applyPreferences(getPreferences());

createRoot(root).render(
  <StrictMode>
    <App initialState={createInitialState(sessionFromSearch())} />
  </StrictMode>,
);
