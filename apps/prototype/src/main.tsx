import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { createInitialState, type Session } from "./state/store";
import "./styles.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Missing #root element");
}

/**
 * Prototype-only review shortcut: `?as=parent-a` or `?as=parent-b` (before the `#`) starts
 * signed in, so a deep link like `/?as=parent-a#/transactions` opens directly. Demo users only.
 */
function sessionFromSearch(): Session | null {
  const as = new URLSearchParams(window.location.search).get("as");
  if (as === "parent-a")
    return { userId: "u-parent-a", householdId: "hh-demo" };
  if (as === "parent-b")
    return { userId: "u-parent-b", householdId: "hh-demo" };
  return null;
}

createRoot(root).render(
  <StrictMode>
    <App initialState={createInitialState(sessionFromSearch())} />
  </StrictMode>,
);
