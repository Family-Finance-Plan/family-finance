/**
 * Pure selectors over the in-memory demo collections (dashboard.md "Development notes",
 * transactions.md). Integer agorot sums only. Transfers and deleted rows never enter
 * income/expense totals (D2, D11). Unapproved review rows are not transactions, so they are
 * never counted (R-008).
 */
import { getCategory, reportingGroup } from "../demo/categories";
import type {
  Account,
  AccountCoverage,
  IsoDate,
  Transaction,
  TxType,
} from "../demo/types";
import { addMonths, daysInMonth, monthOf, normalizeSearch } from "./format";

export const isActive = (t: Transaction): boolean => t.deletedAt === undefined;
export const isCardCharge = (t: Transaction): boolean =>
  t.status === "card-charge-not-itemized";

export function monthStart(ym: string): IsoDate {
  return `${ym}-01`;
}
export function monthEnd(ym: string): IsoDate {
  return `${ym}-${String(daysInMonth(ym)).padStart(2, "0")}`;
}

export interface Totals {
  income: number;
  expense: number;
  balance: number;
  incomeCount: number;
  expenseCount: number;
  transferCount: number;
  count: number;
}

export function totalsOf(transactions: readonly Transaction[]): Totals {
  const totals: Totals = {
    income: 0,
    expense: 0,
    balance: 0,
    incomeCount: 0,
    expenseCount: 0,
    transferCount: 0,
    count: 0,
  };
  for (const t of transactions) {
    if (!isActive(t)) continue;
    totals.count += 1;
    if (t.type === "income") {
      totals.income += t.amountAgorot;
      totals.incomeCount += 1;
    } else if (t.type === "expense") {
      totals.expense += t.amountAgorot;
      totals.expenseCount += 1;
    } else {
      totals.transferCount += 1;
    }
  }
  totals.balance = totals.income - totals.expense;
  return totals;
}

export function inMonth(
  transactions: readonly Transaction[],
  ym: string,
): Transaction[] {
  return transactions.filter((t) => monthOf(t.date) === ym);
}

export function monthTotals(
  transactions: readonly Transaction[],
  ym: string,
): Totals {
  return totalsOf(inMonth(transactions, ym));
}

/** Months that have at least one active transaction, oldest first. */
export function monthsWithData(transactions: readonly Transaction[]): string[] {
  return [
    ...new Set(transactions.filter(isActive).map((t) => monthOf(t.date))),
  ].toSorted();
}

/** Every month from the earliest with data to `currentMonth`, oldest first. */
export function monthRange(
  transactions: readonly Transaction[],
  currentMonth: string,
): string[] {
  const first = monthsWithData(transactions)[0] ?? currentMonth;
  const months: string[] = [];
  for (let m = first; m <= currentMonth; m = addMonths(m, 1)) months.push(m);
  return months;
}

export interface BreakdownRow {
  id: string;
  name: string;
  amount: number;
  /** Whole percent of categorized amounts, rounded down. */
  percent: number;
}

export interface Breakdown {
  rows: BreakdownRow[];
  /** Card charges, not itemized (ADR-004). Expenses only. */
  notItemized: number;
  uncategorized: number;
  categorizedTotal: number;
}

/** Category breakdown of one month by reporting group, sorted by amount descending. */
export function categoryBreakdown(
  transactions: readonly Transaction[],
  ym: string,
  type: "income" | "expense",
): Breakdown {
  const sums = new Map<string, number>();
  let notItemized = 0;
  let uncategorized = 0;
  for (const t of inMonth(transactions, ym)) {
    if (!isActive(t) || t.type !== type) continue;
    if (isCardCharge(t)) {
      notItemized += t.amountAgorot;
      continue;
    }
    const group = t.categoryId ? reportingGroup(t.categoryId) : undefined;
    if (!group) {
      uncategorized += t.amountAgorot;
      continue;
    }
    sums.set(group.id, (sums.get(group.id) ?? 0) + t.amountAgorot);
  }
  const categorizedTotal = [...sums.values()].reduce((a, b) => a + b, 0);
  const rows = [...sums.entries()]
    .map(([id, amount]) => ({
      id,
      name: getCategory(id)?.name ?? id,
      amount,
      percent:
        categorizedTotal === 0
          ? 0
          : Math.floor((amount * 100) / categorizedTotal),
    }))
    .toSorted((a, b) => b.amount - a.amount);
  return { rows, notItemized, uncategorized, categorizedTotal };
}

export interface Coverage {
  /** Itemized, categorized expenses ÷ all expenses, whole percent rounded down. */
  percent: number;
  accountsWithData: number;
  totalAccounts: number;
}

/** Bank accounts whose data overlaps [from, to]. */
export function accountsWithDataIn(
  coverage: readonly AccountCoverage[],
  from: IsoDate,
  to: IsoDate,
): AccountCoverage[] {
  return coverage.filter((c) => c.from <= to && c.to >= from);
}

/**
 * Coverage of a category view (ADR-004, dashboard.md CoverageNote). Card charges and
 * uncategorized expenses are not "itemized categorized". The account count is bank accounts
 * with data in the range out of all accounts including cards (cards have no itemized data in v0.1).
 */
export function coverageForRange(
  transactions: readonly Transaction[],
  coverage: readonly AccountCoverage[],
  accounts: readonly Account[],
  from: IsoDate,
  to: IsoDate,
): Coverage {
  let all = 0;
  let covered = 0;
  for (const t of transactions) {
    if (!isActive(t) || t.type !== "expense" || t.date < from || t.date > to)
      continue;
    all += t.amountAgorot;
    if (t.categoryId !== null && !isCardCharge(t)) covered += t.amountAgorot;
  }
  return {
    percent: all === 0 ? 0 : Math.floor((covered * 100) / all),
    accountsWithData: accountsWithDataIn(coverage, from, to).length,
    totalAccounts: accounts.length,
  };
}

export function coverageForMonth(
  transactions: readonly Transaction[],
  coverage: readonly AccountCoverage[],
  accounts: readonly Account[],
  ym: string,
): Coverage {
  return coverageForRange(
    transactions,
    coverage,
    accounts,
    monthStart(ym),
    monthEnd(ym),
  );
}

export interface Completeness {
  complete: boolean;
  withData: number;
  total: number;
  lastDate: IsoDate | null;
}

/** Data completeness of a month across bank accounts (spec-corrections C). */
export function completeness(
  coverage: readonly AccountCoverage[],
  accounts: readonly Account[],
  ym: string,
): Completeness {
  const banks = accounts.filter((a) => a.kind === "bank");
  const start = monthStart(ym);
  const end = monthEnd(ym);
  const withData = accountsWithDataIn(coverage, start, end).filter((c) =>
    banks.some((b) => b.id === c.accountId),
  );
  const lastDate = withData.reduce<IsoDate | null>((max, c) => {
    const to = c.to > end ? end : c.to;
    return max === null || to > max ? to : max;
  }, null);
  const complete =
    banks.length > 0 &&
    banks.every((b) => {
      const c = coverage.find((x) => x.accountId === b.id);
      return c !== undefined && c.from <= start && c.to >= end;
    });
  return { complete, withData: withData.length, total: banks.length, lastDate };
}

// ---------------------------------------------------------------------------------------------
// Transactions screen filters (transactions.md). One pure function over the collection, so the
// real API can take the same filter object later.

export type PeriodPreset =
  "this-month" | "prev-month" | "3-months" | "year" | "all" | "custom";

export interface TransactionFilters {
  q: string;
  period: PeriodPreset;
  from: IsoDate | "";
  to: IsoDate | "";
  /** Leaf ids, group ids (select all children) or "none" for uncategorized. */
  categories: string[];
  /** Member ids or "none" for no assignment. */
  members: string[];
  /** Bank account ids, or "card-a" for card charge rows. */
  accounts: string[];
  tags: string[];
  type: "all" | TxType;
  document: string;
  showDeleted: boolean;
}

export const defaultFilters: TransactionFilters = {
  q: "",
  period: "3-months",
  from: "",
  to: "",
  categories: [],
  members: [],
  accounts: [],
  tags: [],
  type: "all",
  document: "",
  showDeleted: false,
};

export function periodRange(
  filters: Pick<TransactionFilters, "period" | "from" | "to">,
  today: IsoDate,
): { from: IsoDate; to: IsoDate } {
  const ym = monthOf(today);
  switch (filters.period) {
    case "this-month":
      return { from: monthStart(ym), to: today };
    case "prev-month": {
      const prev = addMonths(ym, -1);
      return { from: monthStart(prev), to: monthEnd(prev) };
    }
    case "3-months":
      return { from: monthStart(addMonths(ym, -2)), to: today };
    case "year":
      return { from: `${today.slice(0, 4)}-01-01`, to: today };
    case "all":
      return { from: "0000-01-01", to: "9999-12-31" };
    case "custom":
      return {
        from: filters.from || "0000-01-01",
        to: filters.to || "9999-12-31",
      };
  }
}

function matchesCategory(t: Transaction, selected: readonly string[]): boolean {
  if (selected.length === 0) return true;
  if (t.categoryId === null)
    return selected.includes("none") && !isCardCharge(t);
  const group = reportingGroup(t.categoryId);
  return (
    selected.includes(t.categoryId) ||
    (group !== undefined && selected.includes(group.id))
  );
}

export function filterTransactions(
  transactions: readonly Transaction[],
  filters: TransactionFilters,
  today: IsoDate,
): Transaction[] {
  const { from, to } = periodRange(filters, today);
  const q = normalizeSearch(filters.q);
  return transactions.filter((t) => {
    if (filters.showDeleted ? isActive(t) : !isActive(t)) return false;
    if (filters.document) {
      if (t.documentId !== filters.document) return false;
    } else if (t.date < from || t.date > to) {
      return false;
    }
    if (q && !normalizeSearch(t.description).includes(q)) return false;
    if (filters.type !== "all" && t.type !== filters.type) return false;
    if (!matchesCategory(t, filters.categories)) return false;
    if (filters.members.length > 0) {
      const ok =
        (filters.members.includes("none") && t.memberIds.length === 0) ||
        t.memberIds.some((m) => filters.members.includes(m));
      if (!ok) return false;
    }
    if (filters.accounts.length > 0) {
      const ok =
        (filters.accounts.includes("card-a") && isCardCharge(t)) ||
        filters.accounts.includes(t.accountId);
      if (!ok) return false;
    }
    if (
      filters.tags.length > 0 &&
      !t.tagIds.some((tag) => filters.tags.includes(tag))
    )
      return false;
    return true;
  });
}

/** Groups transactions by month, newest month first, rows by date descending. */
export function groupByMonth(
  transactions: readonly Transaction[],
): { month: string; rows: Transaction[] }[] {
  const groups = new Map<string, Transaction[]>();
  for (const t of transactions) {
    const m = monthOf(t.date);
    const list = groups.get(m);
    if (list) list.push(t);
    else groups.set(m, [t]);
  }
  return [...groups.entries()]
    .toSorted(([a], [b]) => b.localeCompare(a))
    .map(([month, rows]) => ({
      month,
      rows: rows.toSorted(
        (a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id),
      ),
    }));
}
