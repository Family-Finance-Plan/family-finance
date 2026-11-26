import { describe, expect, it } from "vitest";
import { monthTotals } from "../lib/selectors";
import { getCategory } from "./categories";
import { DEMO_TODAY } from "./demo-today";
import { doc006Rows } from "./documents";
import { demoFutureItems } from "./future-items";
import { demoUsers } from "./household";
import { demoTransactions } from "./transactions.generated";

describe("demo data (demo-data.md generation notes)", () => {
  it("has only positive integer amounts in agorot", () => {
    for (const t of demoTransactions) {
      expect(Number.isSafeInteger(t.amountAgorot)).toBe(true);
      expect(t.amountAgorot).toBeGreaterThan(0);
    }
    for (const r of doc006Rows()) {
      if (r.fields.amountAgorot !== undefined)
        expect(Number.isSafeInteger(r.fields.amountAgorot)).toBe(true);
    }
  });

  it("gives every future item a certainty", () => {
    for (const f of demoFutureItems) {
      expect(["verified", "expected", "estimate"]).toContain(f.certainty);
    }
  });

  it("never counts transfers in income or expense totals", () => {
    const withoutTransfers = demoTransactions.filter(
      (t) => t.type !== "transfer",
    );
    for (const ym of ["2026-08", "2026-09", "2026-10"]) {
      const all = monthTotals(demoTransactions, ym);
      const plain = monthTotals(withoutTransfers, ym);
      expect(all.income).toBe(plain.income);
      expect(all.expense).toBe(plain.expense);
    }
  });

  it("uses only placeholder emails on example.com", () => {
    for (const u of demoUsers) expect(u.email).toMatch(/@example\.com$/);
  });

  it("references only known categories and stays on or before DEMO_TODAY", () => {
    for (const t of demoTransactions) {
      if (t.categoryId !== null)
        expect(getCategory(t.categoryId)).toBeDefined();
      expect(t.date <= DEMO_TODAY).toBe(true);
    }
  });

  it("contains the September row that review row r01 duplicates", () => {
    const r01 = doc006Rows().find((r) => r.id === "r01");
    expect(demoTransactions.some((t) => t.id === r01?.duplicateOf)).toBe(true);
  });
});
