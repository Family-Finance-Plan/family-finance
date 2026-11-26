import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { t } from "../lib/format";
import { he } from "../locale/he";
import { demoTransactions } from "../demo/transactions.generated";
import { navigate } from "../lib/router";
import { createInitialState, TIMINGS } from "../state/store";

function renderAt(hash: string) {
  window.history.replaceState(null, "", `#${hash}`);
  return render(
    <App
      initialState={createInitialState({
        userId: "u-parent-a",
        householdId: "hh-demo",
      })}
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  window.history.replaceState(null, "", "#/");
});

describe("forecast preview (phase 2 layer)", () => {
  it("is off by default and, when on, shows future rows with certainty marks", () => {
    renderAt("/");
    const toggle = screen.getByRole("switch", {
      name: (n) => n.includes(he.dashboard.forecastToggle),
    });
    expect((toggle as HTMLInputElement).checked).toBe(false);
    expect(screen.queryByText(he.dashboard.forecastCaption)).toBeNull();

    fireEvent.click(toggle);
    expect(screen.queryAllByText(he.certainty.expected).length).toBeGreaterThan(
      0,
    ); // legend
    expect(
      screen.getAllByText(he.dashboard.forecastCaption).length,
    ).toBeGreaterThan(0);
    // Rest of October: verified car insurance and building fee, estimated clinic visit.
    expect(screen.getAllByText(he.certainty.verified).length).toBeGreaterThan(
      0,
    );
    expect(screen.getAllByText(he.certainty.estimate).length).toBeGreaterThan(
      0,
    );

    // Editing a future amount requires choosing "save" or "temporary estimate".
    fireEvent.click(
      screen.getByRole("button", {
        name: `${he.dashboard.editFutureAmount}: ביטוח רכב`,
      }),
    );
    const dialog = screen.getByRole("dialog", { name: he.future.dialogTitle });
    const ok = within(dialog).getByRole("button", {
      name: he.common.confirm,
    }) as HTMLButtonElement;
    expect(ok.disabled).toBe(true);
    fireEvent.click(
      within(dialog).getByRole("radio", {
        name: new RegExp(he.future.temporary),
      }),
    );
    expect(ok.disabled).toBe(false);
  });
});

describe("upload (file contents are never read)", () => {
  it("acknowledges an itemized card statement with a note and imports nothing", () => {
    vi.useFakeTimers();
    renderAt("/upload");
    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("no file input");
    const file = new File(["x"], "card-2026-10.pdf", {
      type: "application/pdf",
    });
    fireEvent.change(input, { target: { files: [file] } });
    act(() => {
      vi.advanceTimersByTime(
        TIMINGS.progressStep * 5 + TIMINGS.extraction + 100,
      );
    });
    expect(screen.getByText(he.upload.cardNote)).toBeTruthy();
    // Only the pending demo statement waits for review; nothing new was added.
    expect(
      screen.getAllByText(he.upload.statuses["awaiting-review"]),
    ).toHaveLength(1);
    // The transaction count is unchanged.
    act(() => navigate("/transactions?period=all", { replace: true }));
    const active = demoTransactions.filter((x) => !x.deletedAt).length;
    expect(
      screen.getByText((text) => text.startsWith(`${active} `), {
        selector: "bdi",
      }),
    ).toBeTruthy();
  });

  it("rejects unsupported and oversized files before anything else", () => {
    renderAt("/upload");
    const input =
      document.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error("no file input");
    const big = new File(["x"], "big.pdf");
    Object.defineProperty(big, "size", { value: 11 * 1024 * 1024 });
    fireEvent.change(input, {
      target: { files: [new File(["x"], "notes.txt"), big] },
    });
    expect(screen.getByText(he.upload.unsupported)).toBeTruthy();
    expect(screen.getByText(he.upload.tooLarge)).toBeTruthy();
    expect(screen.getByText(t(he.upload.added, { n: 2 }))).toBeTruthy();
  });
});

describe("prototype role switcher", () => {
  it("hides upload and edit controls for the view-only role", () => {
    renderAt("/transactions");
    expect(
      screen.getAllByRole("link", { name: new RegExp(he.nav.upload) }).length,
    ).toBeGreaterThan(0);
    fireEvent.click(
      screen.getByRole("button", {
        name: t(he.userMenu.open, { name: "הורה א" }),
      }),
    );
    fireEvent.click(screen.getByRole("radio", { name: he.roles.limited }));
    expect(
      screen.queryAllByRole("link", { name: new RegExp(he.nav.upload) }),
    ).toHaveLength(0);
    expect(screen.queryAllByRole("checkbox", { name: /בחירת/ })).toHaveLength(
      0,
    );
  });
});

describe("forecast preview: expected items", () => {
  it("shows expected salaries in November, separate from verified and estimated amounts", () => {
    renderAt("/");
    fireEvent.click(
      screen.getByRole("switch", {
        name: (n) => n.includes(he.dashboard.forecastToggle),
      }),
    );
    fireEvent.click(
      screen.getByRole("button", { name: he.dashboard.nextMonth }),
    );
    const income = screen.getByRole("region", {
      name: `${he.dashboard.income} ${he.dashboard.phase2}`,
    });
    // One line per certainty, never a single mixed total (R-009).
    expect(within(income).getByText(he.certainty.expected)).toBeTruthy();
    expect(within(income).getByText(he.certainty.verified)).toBeTruthy();
    expect(within(income).getByText(he.certainty.estimate)).toBeTruthy();
    expect(income.textContent).toContain("26,300"); // salaries A + B, expected
    // The November group lists the expected rows.
    expect(screen.getAllByText("משכורת – הורה א").length).toBeGreaterThan(0);
  });
});

describe("review screen highlighting", () => {
  it("marks low-confidence fields and unparsed rows", () => {
    renderAt("/upload/doc-006/review");
    // r04, r05, r06, r08, r10, r11, r15 have one uncertain field each; r17 has two.
    expect(
      screen.getAllByRole("img", { name: he.status.lowConfidence }),
    ).toHaveLength(9);
    // Two unparsed rows: status label, red tint and the raw source text.
    expect(screen.getAllByText(he.review.statuses.unparsed)).toHaveLength(2);
    expect(
      document.querySelectorAll("tbody.review-row--unparsed"),
    ).toHaveLength(2);
    expect(screen.getAllByText(he.review.rawText)).toHaveLength(2);
    // Confirming a field clears its mark.
    fireEvent.click(
      screen.getAllByRole("button", {
        name: he.review.confirmValue,
      })[0] as HTMLElement,
    );
    expect(
      screen.getAllByRole("img", { name: he.status.lowConfidence }),
    ).toHaveLength(8);
  });
});
