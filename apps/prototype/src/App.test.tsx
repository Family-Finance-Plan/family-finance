import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";
import { navigate } from "./lib/router";
import { t } from "./lib/format";
import { he } from "./locale/he";
import { createInitialState, type Session } from "./state/store";

const parentA: Session = { userId: "u-parent-a", householdId: "hh-demo" };

function renderAt(hash: string, session: Session | null = parentA) {
  window.history.replaceState(null, "", `#${hash}`);
  return render(<App initialState={createInitialState(session)} />);
}

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "#/");
});

describe("every route renders with the prototype banner", () => {
  const signedIn = [
    "/",
    "/?state=loading",
    "/?state=empty",
    "/?state=error",
    "/transactions",
    "/transactions?category=food&month=2026-09",
    "/transactions?deleted=1",
    "/upload",
    "/upload/doc-006/review",
    "/upload/doc-004/review",
    "/household",
    "/settings",
    "/invite/accept?invite=u-invited",
    "/invite/accept?invite=missing",
  ];

  for (const route of signedIn) {
    it(`renders ${route}`, () => {
      renderAt(route);
      expect(screen.getAllByText(he.banner.title).length).toBeGreaterThan(0);
      expect(screen.getByRole("note")).toBeTruthy();
    });
  }

  it("renders /sign-in when signed out", () => {
    renderAt("/sign-in", null);
    expect(screen.getByText(he.banner.title)).toBeTruthy();
    expect(screen.getByRole("button", { name: he.signIn.google })).toBeTruthy();
  });

  it("renders /setup for a new user without a household", () => {
    renderAt("/setup", { userId: "u-new", householdId: null });
    expect(screen.getByText(he.banner.title)).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: he.setup.step1Title }),
    ).toBeTruthy();
  });

  it("redirects a signed-out visitor to sign-in", async () => {
    renderAt("/transactions", null);
    expect(
      await screen.findByRole("button", { name: he.signIn.google }),
    ).toBeTruthy();
  });

  it("shows the Hebrew dashboard with the coverage line for October", () => {
    renderAt("/");
    expect(
      screen.getByRole("heading", { name: he.dashboard.title, level: 1 }),
    ).toBeTruthy();
    expect(
      screen.getByText(t(he.dashboard.coverage, { p: 56, n: 1, total: 3 })),
    ).toBeTruthy();
  });
});

describe("approving the pending review updates the Dashboard", () => {
  const incomeCard = () =>
    screen.getByRole("region", { name: he.dashboard.income });

  it("moves approved rows into the October totals only after intake", async () => {
    renderAt("/");
    // Before: October income is salary A only (14,500 ₪); account B's October waits for review.
    expect(incomeCard().textContent).toContain("14,500");
    expect(
      screen.getByText(t(he.dashboard.coverage, { p: 56, n: 1, total: 3 })),
    ).toBeTruthy();

    act(() => navigate("/upload/doc-006/review", { replace: true }));
    expect(
      await screen.findByRole("heading", { name: he.review.title }),
    ).toBeTruthy();

    // Approve every row that can be approved by selection.
    fireEvent.click(
      screen.getByRole("checkbox", { name: he.review.selectAll }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: he.review.approveSelected }),
    );
    // The possible duplicate needs a decision; unparsed rows are rejected.
    fireEvent.click(screen.getByRole("radio", { name: he.review.skip }));
    fireEvent.click(
      screen.getByRole("button", { name: t(he.review.rejectRow, { n: 12 }) }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: t(he.review.rejectRow, { n: 14 }) }),
    );

    // Nothing is counted before "סיום וקליטה" (R-008).
    const finish = screen.getByRole("button", { name: he.review.finish });
    expect((finish as HTMLButtonElement).disabled).toBe(false);
    fireEvent.click(finish);
    const dialog = await screen.findByRole("dialog", {
      name: he.review.confirmTitle,
    });
    expect(dialog.textContent).toContain(
      t(he.review.confirmText, { a: 15, r: 2 }),
    );
    fireEvent.click(
      within(dialog).getByRole("button", { name: he.review.intake }),
    );

    // After intake the app shows the imported transactions.
    expect(
      await screen.findByText(
        t(he.transactions.afterIntake, {
          n: 15,
          file: "statement-b-2026-10.pdf",
        }),
      ),
    ).toBeTruthy();

    act(() => navigate("/", { replace: true }));
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: he.dashboard.title, level: 1 }),
      ).toBeTruthy(),
    );
    // After: + salary B 11,800 + refund 89 = 26,389 ₪, and account B now has October data.
    // Coverage drops to 51% because r10 (a transfer extracted as an uncategorized expense) was approved as is.
    expect(incomeCard().textContent).toContain("26,389");
    expect(
      screen.getByText(t(he.dashboard.coverage, { p: 51, n: 2, total: 3 })),
    ).toBeTruthy();
  });
});

describe("no backend calls", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders every route without using fetch or XMLHttpRequest", () => {
    const fetchSpy = vi.fn<() => never>(() => {
      throw new Error("fetch must not be called");
    });
    let xhrCount = 0;
    function NoXhr() {
      xhrCount += 1;
      throw new Error("XMLHttpRequest must not be used");
    }
    vi.stubGlobal("fetch", fetchSpy);
    vi.stubGlobal("XMLHttpRequest", NoXhr);
    const routes = [
      "/",
      "/transactions",
      "/upload",
      "/upload/doc-006/review",
      "/household",
      "/invite/accept?invite=u-invited",
    ];
    for (const route of routes) {
      renderAt(route);
      expect(screen.getAllByText(he.banner.title).length).toBeGreaterThan(0);
      cleanup();
    }
    renderAt("/sign-in", null);
    renderAt("/setup", { userId: "u-new", householdId: null });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(xhrCount).toBe(0);
  });
});
