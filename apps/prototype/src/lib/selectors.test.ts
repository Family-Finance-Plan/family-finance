import { describe, expect, it } from "vitest";
import { demoAccounts, demoCoverage } from "../demo/household";
import { demoTransactions } from "../demo/transactions.generated";
import type { Account, AccountCoverage, Transaction } from "../demo/types";
import {
  categoryBreakdown,
  completeness,
  coverageForMonth,
  defaultFilters,
  filterTransactions,
  monthTotals,
} from "./selectors";

let seq = 0;
function tx(partial: Partial<Transaction>): Transaction {
  seq += 1;
  return {
    id: `t-${seq}`,
    accountId: "acc-a",
    date: "2026-09-10",
    description: "test",
    type: "expense",
    amountAgorot: 1000,
    categoryId: "supermarket",
    memberIds: [],
    tagIds: [],
    documentId: "doc-x",
    history: [],
    ...partial,
  };
}

const accounts: Account[] = [
  { id: "acc-a", name: "A", kind: "bank" },
  { id: "acc-b", name: "B", kind: "bank" },
  {
    id: "card-a",
    name: "C",
    kind: "card",
    chargedTo: "acc-a",
    itemized: false,
  },
];
const coverage: AccountCoverage[] = [
  { accountId: "acc-a", from: "2026-08-01", to: "2026-10-15" },
  { accountId: "acc-b", from: "2026-08-01", to: "2026-09-30" },
];

describe("coverageForMonth", () => {
  it("counts only itemized, categorized expenses and rounds down", () => {
    const rows = [
      tx({ amountAgorot: 6000, categoryId: "supermarket" }),
      tx({
        amountAgorot: 3000,
        categoryId: null,
        status: "card-charge-not-itemized",
      }),
      tx({ amountAgorot: 1000, categoryId: null }),
      tx({ amountAgorot: 2, categoryId: "fuel" }),
      // Income, transfers and deleted rows do not affect expense coverage.
      tx({ type: "income", amountAgorot: 99999, categoryId: "refunds" }),
      tx({ type: "transfer", amountAgorot: 50000, categoryId: null }),
      tx({ amountAgorot: 50000, categoryId: null, deletedAt: "2026-10-01" }),
    ];
    // 6002 / 10002 = 60.008% → 60 (never overstated)
    expect(coverageForMonth(rows, coverage, accounts, "2026-09")).toEqual({
      percent: 60,
      accountsWithData: 2,
      totalAccounts: 3,
    });
  });

  it("rounds 99.99% down to 99", () => {
    const rows = [
      tx({ amountAgorot: 9999 }),
      tx({ amountAgorot: 1, categoryId: null }),
    ];
    expect(coverageForMonth(rows, coverage, accounts, "2026-09").percent).toBe(
      99,
    );
  });

  it("counts bank accounts with data in the month out of all accounts including the card", () => {
    expect(coverageForMonth([], coverage, accounts, "2026-10")).toEqual({
      percent: 0,
      accountsWithData: 1,
      totalAccounts: 3,
    });
  });

  it("matches the demo target for September: 63% · 2 of 3 accounts", () => {
    expect(
      coverageForMonth(demoTransactions, demoCoverage, demoAccounts, "2026-09"),
    ).toEqual({
      percent: 63,
      accountsWithData: 2,
      totalAccounts: 3,
    });
  });
});

describe("monthTotals", () => {
  it("excludes transfers and deleted rows from income and expense totals", () => {
    const rows = [
      tx({ type: "income", amountAgorot: 100000 }),
      tx({ type: "expense", amountAgorot: 40000 }),
      tx({ type: "transfer", amountAgorot: 400000 }),
      tx({ type: "expense", amountAgorot: 7000, deletedAt: "2026-10-01" }),
    ];
    const totals = monthTotals(rows, "2026-09");
    expect(totals.income).toBe(100000);
    expect(totals.expense).toBe(40000);
    expect(totals.balance).toBe(60000);
    expect(totals.transferCount).toBe(1);
  });
});

describe("categoryBreakdown", () => {
  it("groups by parent category and keeps card charges separate", () => {
    const rows = [
      tx({ amountAgorot: 3000, categoryId: "supermarket" }),
      tx({ amountAgorot: 1000, categoryId: "cafes" }),
      tx({ amountAgorot: 1000, categoryId: "fuel" }),
      tx({
        amountAgorot: 9000,
        categoryId: null,
        status: "card-charge-not-itemized",
      }),
    ];
    const b = categoryBreakdown(rows, "2026-09", "expense");
    expect(b.rows.map((r) => [r.id, r.amount, r.percent])).toEqual([
      ["food", 4000, 80],
      ["transport", 1000, 20],
    ]);
    expect(b.notItemized).toBe(9000);
  });
});

describe("completeness", () => {
  it("reports partial months per bank account", () => {
    expect(completeness(coverage, accounts, "2026-09")).toMatchObject({
      complete: true,
      withData: 2,
      total: 2,
    });
    expect(completeness(coverage, accounts, "2026-10")).toEqual({
      complete: false,
      withData: 1,
      total: 2,
      lastDate: "2026-10-15",
    });
  });
});

describe("filterTransactions", () => {
  it("filters by search, category group, member and type", () => {
    const rows = [
      tx({
        description: "סופר שכונתי",
        categoryId: "supermarket",
        memberIds: ["m-family"],
      }),
      tx({
        description: "תחנת דלק לדוגמה",
        categoryId: "fuel",
        memberIds: ["m-parent-a"],
      }),
      tx({ description: "Example Store", categoryId: null }),
      tx({ description: "העברה", type: "transfer", categoryId: null }),
    ];
    const f = { ...defaultFilters, period: "all" as const };
    const today = "2026-10-15";
    expect(filterTransactions(rows, { ...f, q: "סופר" }, today)).toHaveLength(
      1,
    );
    expect(
      filterTransactions(rows, { ...f, categories: ["food"] }, today),
    ).toHaveLength(1);
    expect(
      filterTransactions(rows, { ...f, categories: ["none"] }, today),
    ).toHaveLength(2);
    expect(
      filterTransactions(rows, { ...f, members: ["m-parent-a"] }, today),
    ).toHaveLength(1);
    expect(
      filterTransactions(rows, { ...f, q: "example store" }, today),
    ).toHaveLength(1);
    expect(
      filterTransactions(rows, { ...f, type: "transfer" }, today),
    ).toHaveLength(1);
  });
});
