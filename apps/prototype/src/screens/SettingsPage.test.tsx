import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { App } from "../App";
import {
  applyPreferences,
  DEFAULT_PREFERENCES,
  getPreferences,
  resetPreferences,
  sanitize,
  setPreferences,
} from "../lib/preferences";
import { he } from "../locale/he";
import { createInitialState } from "../state/store";

const html = document.documentElement;

function renderAt(hash: string, signedIn = true) {
  window.history.replaceState(null, "", `#${hash}`);
  return render(
    <App
      initialState={createInitialState(
        signedIn ? { userId: "u-parent-a", householdId: "hh-demo" } : null,
      )}
    />,
  );
}

afterEach(() => {
  cleanup();
  resetPreferences();
  window.localStorage.clear();
  window.history.replaceState(null, "", "#/");
});

describe("preferences", () => {
  it("drops unknown values and keeps known ones", () => {
    expect(sanitize({ theme: "neon", textSize: "lg", extra: 1 })).toEqual({
      ...DEFAULT_PREFERENCES,
      textSize: "lg",
    });
    expect(sanitize(null)).toEqual(DEFAULT_PREFERENCES);
  });

  it("writes only non-default choices onto <html>", () => {
    const el = document.createElement("html");
    applyPreferences(
      { ...DEFAULT_PREFERENCES, theme: "dark", density: "compact" },
      el,
    );
    expect(el.getAttribute("data-theme")).toBe("dark");
    expect(el.getAttribute("data-density")).toBe("compact");
    expect(el.hasAttribute("data-text-size")).toBe(false);
    expect(el.hasAttribute("data-motion")).toBe(false);
  });

  it("saves the choice on this device", () => {
    setPreferences({ theme: "light" });
    expect(
      JSON.parse(window.localStorage.getItem("ff-proto-preferences") ?? "{}"),
    ).toMatchObject({
      theme: "light",
    });
  });
});

describe("settings screen", () => {
  it("is reachable from the navigation", () => {
    renderAt("/");
    const links = screen.getAllByRole("link", { name: he.nav.settings });
    expect(links.length).toBeGreaterThan(0);
  });

  it("switches the theme and the text size right away", () => {
    renderAt("/settings");
    expect(
      screen.getByRole("heading", { level: 1, name: he.settings.title }),
    ).toBeTruthy();

    const theme = within(
      screen.getByRole("group", { name: he.settings.theme }),
    );
    fireEvent.click(
      theme.getByRole("radio", { name: he.settings.themes.dark }),
    );
    expect(html.getAttribute("data-theme")).toBe("dark");
    expect(getPreferences().theme).toBe("dark");

    fireEvent.click(
      screen.getByRole("radio", { name: he.settings.textSizes.xl }),
    );
    expect(html.getAttribute("data-text-size")).toBe("xl");

    fireEvent.click(
      theme.getByRole("radio", { name: he.settings.themes.system }),
    );
    expect(html.hasAttribute("data-theme")).toBe(false);
  });

  it("resets every choice to the defaults", () => {
    renderAt("/settings");
    fireEvent.click(
      screen.getByRole("radio", { name: he.settings.densities.compact }),
    );
    fireEvent.click(
      screen.getByRole("radio", { name: he.settings.motions.reduce }),
    );
    fireEvent.click(screen.getByRole("button", { name: he.settings.reset }));
    expect(getPreferences()).toEqual(DEFAULT_PREFERENCES);
    expect(html.hasAttribute("data-density")).toBe(false);
    expect(screen.getByText(he.settings.resetDone)).toBeTruthy();
  });

  it("opens the chosen start page after sign-in", () => {
    setPreferences({ startPage: "/transactions" });
    renderAt("/sign-in");
    // The demo session already has a household, so /sign-in redirects to the start page.
    expect(window.location.hash).toBe("#/transactions");
  });
});
