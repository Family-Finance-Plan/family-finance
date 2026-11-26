/** All approved transactions, grouped by month, with filters, quick edit and bulk actions (transactions.md). */
import { type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader } from "../components/AppShell";
import { EmptyState, ErrorState, SkeletonRows } from "../components/feedback";
import { Icon } from "../components/Icon";
import { Modal, Popover } from "../components/overlays";
import { CategoryPicker, MemberTagPicker } from "../components/pickers";
import { TransactionEditDrawer } from "../components/TransactionEditDrawer";
import {
  MonthGroupHeader,
  TransactionCards,
  TransactionTable,
} from "../components/TransactionTable";
import {
  assignableCategories,
  expenseTree,
  getCategory,
} from "../demo/categories";
import { DEMO_TODAY } from "../demo/demo-today";
import type { Transaction, TxType } from "../demo/types";
import {
  formatAmount,
  formatDate,
  formatMonth,
  monthOf,
  t,
} from "../lib/format";
import { Link, navigate, useLocation, withQuery } from "../lib/router";
import {
  coverageForRange,
  defaultFilters,
  filterTransactions,
  groupByMonth,
  isActive,
  isCardCharge,
  monthEnd,
  monthStart,
  type PeriodPreset,
  periodRange,
  totalsOf,
  type TransactionFilters,
} from "../lib/selectors";
import { PHONE_QUERY, useMediaQuery } from "../lib/useMediaQuery";
import { he } from "../locale/he";
import { useCurrent } from "../state/store";
import { useTransactionActions } from "../state/useTransactionActions";
import { CoverageNote } from "./dashboard/CategoryBreakdown";

const PERIODS: PeriodPreset[] = [
  "this-month",
  "prev-month",
  "3-months",
  "year",
  "all",
  "custom",
];
const list = (v: string | null): string[] =>
  v ? v.split(",").filter(Boolean) : [];

/** Filters live in the URL query so views can be shared and back/forward works. */
export function filtersFromQuery(q: URLSearchParams): TransactionFilters {
  const month = q.get("month");
  const period =
    (q.get("period") as PeriodPreset | null) ??
    (month ? "custom" : defaultFilters.period);
  const type = q.get("type");
  return {
    q: q.get("q") ?? "",
    period: PERIODS.includes(period) ? period : defaultFilters.period,
    from: q.get("from") ?? (month ? monthStart(month) : ""),
    to: q.get("to") ?? (month ? monthEnd(month) : ""),
    categories: list(q.get("category")),
    members: list(q.get("member")),
    accounts: list(q.get("account")),
    tags: list(q.get("tag")),
    type:
      type === "income" || type === "expense" || type === "transfer"
        ? type
        : "all",
    document: q.get("document") ?? "",
    showDeleted: q.get("deleted") === "1",
  };
}

function toQuery(f: TransactionFilters): string {
  return withQuery("/transactions", {
    q: f.q || undefined,
    period: f.period !== defaultFilters.period ? f.period : undefined,
    from: f.period === "custom" ? f.from || undefined : undefined,
    to: f.period === "custom" ? f.to || undefined : undefined,
    category: f.categories.join(",") || undefined,
    member: f.members.join(",") || undefined,
    account: f.accounts.join(",") || undefined,
    tag: f.tags.join(",") || undefined,
    type: f.type !== "all" ? f.type : undefined,
    document: f.document || undefined,
    deleted: f.showDeleted ? "1" : undefined,
  });
}

interface Option {
  id: string;
  label: string;
  children?: Option[];
}

function MultiSelect({
  label,
  options,
  selected,
  onChange,
  searchable = false,
}: {
  label: string;
  options: Option[];
  selected: readonly string[];
  onChange: (ids: string[]) => void;
  searchable?: boolean;
}) {
  const [q, setQ] = useState("");
  const match = (o: Option) =>
    !q ||
    o.label.includes(q) ||
    (o.children ?? []).some((c) => c.label.includes(q));
  const toggle = (id: string, childIds: string[] = []) => {
    if (selected.includes(id))
      onChange(selected.filter((x) => x !== id && !childIds.includes(x)));
    else onChange([...selected.filter((x) => !childIds.includes(x)), id]);
  };
  return (
    <div className="multi">
      {searchable ? (
        <label className="picker__search">
          <span className="sr-only">{he.transactions.filterSearch}</span>
          <Icon name="search" size={16} />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={he.transactions.filterSearch}
            data-autofocus
          />
        </label>
      ) : null}
      <fieldset className="multi__list">
        <legend className="sr-only">{label}</legend>
        {options.filter(match).map((o) => {
          const childIds = (o.children ?? []).map((c) => c.id);
          const groupOn = selected.includes(o.id);
          return (
            <div key={o.id}>
              <label
                className={`check-row ${o.children ? "check-row--group" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={groupOn}
                  onChange={() => toggle(o.id, childIds)}
                />
                {o.label}
              </label>
              {o.children
                ? o.children
                    .filter(
                      (c) => !q || c.label.includes(q) || o.label.includes(q),
                    )
                    .map((c) => (
                      <label key={c.id} className="check-row check-row--child">
                        <input
                          type="checkbox"
                          checked={groupOn || selected.includes(c.id)}
                          disabled={groupOn}
                          onChange={() => toggle(c.id)}
                        />
                        {c.label}
                      </label>
                    ))
                : null}
            </div>
          );
        })}
      </fieldset>
    </div>
  );
}

function FilterButton({
  label,
  count,
  children,
}: {
  label: string;
  count: number;
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="popover-anchor">
      <button
        type="button"
        className={`filter-btn ${count > 0 ? "is-active" : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((o) => !o)}
      >
        {label}
        {count > 0 ? <span className="count-badge">{count}</span> : null}
        <Icon name="chevronDown" size={16} />
      </button>
      {open ? (
        <Popover
          label={label}
          onClose={() => setOpen(false)}
          className="popover--filter"
        >
          {children(() => setOpen(false))}
        </Popover>
      ) : null}
    </span>
  );
}

export function TransactionsPage() {
  const { data, can } = useCurrent();
  const { query } = useLocation();
  const isPhone = useMediaQuery(PHONE_QUERY);
  const actions = useTransactionActions();
  const qs = query.toString();
  const filters = useMemo(
    () => filtersFromQuery(new URLSearchParams(qs)),
    [qs],
  );
  const setFilters = (patch: Partial<TransactionFilters>) =>
    navigate(toQuery({ ...filters, ...patch }), { replace: true });
  const [search, setSearch] = useState(filters.q);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [expandedExtra, setExpandedExtra] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<{
    col: "date" | "description" | "amount";
    dir: "asc" | "desc";
  }>({ col: "date", dir: "desc" });
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [highlight, setHighlight] = useState<string | null>(null);
  const [sheet, setSheet] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);
  const [bulkPanel, setBulkPanel] = useState<"category" | "assign" | null>(
    null,
  );
  const [bulkMembers, setBulkMembers] = useState<{ m: string[]; t: string[] }>({
    m: [],
    t: [],
  });
  const [retried, setRetried] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const editable = can("editTransactions");
  const forced = retried ? null : query.get("state");

  // Debounced search (250ms) into the URL. Runs on typing only, not when the URL changes.
  /* oxlint-disable react-hooks/exhaustive-deps, react/exhaustive-effect-dependencies */
  useEffect(() => {
    if (search === filters.q) return;
    const id = setTimeout(() => setFilters({ q: search }), 250);
    return () => clearTimeout(id);
  }, [search]);
  /* oxlint-enable react-hooks/exhaustive-deps, react/exhaustive-effect-dependencies */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (
        // Physical key (e.code), so it also works on a Hebrew layout.
        e.code === "Slash" &&
        !["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName)
      ) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (!highlight) return;
    const id = setTimeout(() => setHighlight(null), 1000);
    return () => clearTimeout(id);
  }, [highlight]);

  const results = useMemo(
    () => filterTransactions(data.transactions, filters, DEMO_TODAY),
    [data.transactions, filters],
  );
  const sortedGroups = useMemo(() => {
    const groups = groupByMonth(results);
    const factor = sort.dir === "asc" ? 1 : -1;
    return groups.map((g) => ({
      ...g,
      rows: g.rows.toSorted((a, b) => {
        if (sort.col === "amount")
          return factor * (a.amountAgorot - b.amountAgorot);
        if (sort.col === "description")
          return factor * a.description.localeCompare(b.description, "he");
        return factor * a.date.localeCompare(b.date);
      }),
    }));
  }, [results, sort]);
  const totals = totalsOf(results);
  const range = periodRange(filters, DEMO_TODAY);
  const manyRows = results.length > 100;
  const isOpen = (ym: string, index: number) =>
    !collapsed.has(ym) && (expandedExtra.has(ym) || !manyRows || index === 0);
  const toggleMonth = (ym: string, index: number) => {
    if (isOpen(ym, index)) {
      setCollapsed((c) => new Set([...c, ym]));
      setExpandedExtra((e) => new Set([...e].filter((x) => x !== ym)));
    } else {
      setCollapsed((c) => new Set([...c].filter((x) => x !== ym)));
      setExpandedExtra((e) => new Set([...e, ym]));
    }
  };
  const toggleRow = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const selectedTx = data.transactions.filter((x) => selected.has(x.id));
  const clearSelection = () => {
    setSelected(new Set());
    setBulkPanel(null);
  };

  // Filter option lists.
  const categoryOptions: Option[] = [
    { id: "none", label: he.status.uncategorized },
    ...expenseTree().map(({ group, children }) => ({
      id: group.id,
      label: group.name,
      children: children.map((c) => ({ id: c.id, label: c.name })),
    })),
    {
      id: "income-group",
      label: he.types.incomePlural,
      children: assignableCategories("income").map((c) => ({
        id: c.id,
        label: c.name,
      })),
    },
  ];
  const memberOptions: Option[] = [
    ...data.members.map((m) => ({ id: m.id, label: m.name })),
    { id: "none", label: he.transactions.noAssignment },
  ];
  const accountOptions: Option[] = [
    ...data.accounts
      .filter((a) => a.kind === "bank")
      .map((a) => ({ id: a.id, label: a.name })),
    { id: "card-a", label: he.transactions.cardCharges },
  ];
  const tagOptions: Option[] = data.tags.map((tg) => ({
    id: tg.id,
    label: tg.name,
  }));
  // "income-group" is a UI-only parent; expand it to its children for the filter.
  const setCategories = (ids: string[]) =>
    setFilters({
      categories: ids.flatMap((id) =>
        id === "income-group"
          ? assignableCategories("income").map((c) => c.id)
          : [id],
      ),
    });

  const nameOf = (opts: Option[], id: string): string => {
    for (const o of opts) {
      if (o.id === id) return o.label;
      const c = o.children?.find((x) => x.id === id);
      if (c) return c.label;
    }
    return getCategory(id)?.name ?? id;
  };
  const chips: {
    key: string;
    label: string;
    value: string;
    remove: () => void;
  }[] = [
    ...filters.categories.map((id) => ({
      key: `c-${id}`,
      label: he.transactions.category,
      value: nameOf(categoryOptions, id),
      remove: () =>
        setFilters({ categories: filters.categories.filter((x) => x !== id) }),
    })),
    ...filters.members.map((id) => ({
      key: `m-${id}`,
      label: he.transactions.member,
      value: nameOf(memberOptions, id),
      remove: () =>
        setFilters({ members: filters.members.filter((x) => x !== id) }),
    })),
    ...filters.accounts.map((id) => ({
      key: `a-${id}`,
      label: he.transactions.account,
      value: nameOf(accountOptions, id),
      remove: () =>
        setFilters({ accounts: filters.accounts.filter((x) => x !== id) }),
    })),
    ...filters.tags.map((id) => ({
      key: `t-${id}`,
      label: he.transactions.tags,
      value: nameOf(tagOptions, id),
      remove: () => setFilters({ tags: filters.tags.filter((x) => x !== id) }),
    })),
    ...(filters.type !== "all"
      ? [
          {
            key: "type",
            label: he.transactions.type,
            value: he.types[`${filters.type}Plural` as const],
            remove: () => setFilters({ type: "all" }),
          },
        ]
      : []),
    ...(filters.period !== defaultFilters.period
      ? [
          {
            key: "period",
            label: he.transactions.period,
            value:
              filters.period === "custom"
                ? `${filters.from ? formatDate(filters.from) : "…"}–${filters.to ? formatDate(filters.to) : "…"}`
                : he.transactions.periods[filters.period],
            remove: () =>
              setFilters({ period: defaultFilters.period, from: "", to: "" }),
          },
        ]
      : []),
  ];
  const activeCount = chips.length + (filters.q ? 1 : 0);
  const clearAll = () => {
    setSearch("");
    navigate("/transactions", { replace: true });
  };

  const periodControl = (close?: () => void) => (
    <div className="period">
      <fieldset>
        <legend className="sr-only">{he.transactions.period}</legend>
        {PERIODS.map((p) => (
          <label key={p} className="radio-row">
            <input
              type="radio"
              name="period"
              checked={filters.period === p}
              onChange={() => {
                setFilters({
                  period: p,
                  ...(p !== "custom" ? { from: "", to: "" } : {}),
                });
                if (p !== "custom") close?.();
              }}
            />
            {he.transactions.periods[p]}
          </label>
        ))}
      </fieldset>
      {filters.period === "custom" ? (
        <div className="field-grid">
          <label className="field">
            <span className="field-label">{he.transactions.from}</span>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters({ from: e.target.value })}
            />
          </label>
          <label className="field">
            <span className="field-label">{he.transactions.to}</span>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters({ to: e.target.value })}
            />
          </label>
        </div>
      ) : null}
    </div>
  );
  const typeControl = (
    <div className="segmented" role="group" aria-label={he.transactions.type}>
      {(["all", "income", "expense", "transfer"] as const).map((k) => (
        <button
          key={k}
          type="button"
          aria-pressed={filters.type === k}
          className={filters.type === k ? "is-on" : ""}
          onClick={() => setFilters({ type: k })}
        >
          {k === "all" ? he.types.all : he.types[`${k}Plural` as const]}
        </button>
      ))}
    </div>
  );
  const searchControl = (
    <label className="search-field">
      <span className="sr-only">{he.transactions.searchLabel}</span>
      <Icon name="search" size={18} />
      <input
        ref={searchRef}
        type="search"
        value={search}
        placeholder={he.transactions.searchPlaceholder}
        onChange={(e) => setSearch(e.target.value)}
      />
      {search ? (
        <button
          type="button"
          className="icon-btn icon-btn--xs"
          aria-label={he.transactions.clearSearch}
          onClick={() => setSearch("")}
        >
          <Icon name="close" size={14} />
        </button>
      ) : null}
    </label>
  );
  const deletedToggle = (
    <label className="switch-row">
      <input
        type="checkbox"
        role="switch"
        aria-checked={filters.showDeleted}
        checked={filters.showDeleted}
        onChange={(e) => setFilters({ showDeleted: e.target.checked })}
      />
      {he.transactions.showDeleted}
    </label>
  );

  const doc = filters.document
    ? data.documents.find((d) => d.id === filters.document)
    : undefined;
  const drawerTx = drawerId
    ? data.transactions.find((x) => x.id === drawerId)
    : undefined;
  const rowMenu = (tx: Transaction) => (
    <RowMenu
      tx={tx}
      editable={editable}
      onEdit={() => setDrawerId(tx.id)}
      onDelete={() => actions.remove([tx.id])}
      onRestore={() => actions.restore([tx.id])}
    />
  );

  // Bulk helpers
  const bulkType: "income" | "expense" =
    selectedTx.length > 0 && selectedTx.every((x) => x.type === "income")
      ? "income"
      : "expense";
  const fitting = selectedTx.filter(
    (x) => x.type === bulkType && !isCardCharge(x),
  );
  const otherType = selectedTx.length - fitting.length;

  const hasAny = data.transactions.some(isActive);

  return (
    <div className="page page--with-bar">
      <PageHeader title={he.transactions.title}>
        <span className="popover-anchor">
          <ShortcutsButton />
        </span>
        {can("upload") && !isPhone ? (
          <Link to="/upload" className="btn btn--primary">
            <Icon name="upload" size={18} />
            {he.transactions.upload}
          </Link>
        ) : null}
      </PageHeader>

      {forced === "loading" ? (
        <div className="card">
          <SkeletonRows rows={10} />
        </div>
      ) : forced === "error" ? (
        <ErrorState
          message={he.transactions.error}
          onRetry={() => setRetried(true)}
        />
      ) : forced === "empty" || !hasAny ? (
        <EmptyState
          icon="list"
          title={he.transactions.emptyTitle}
          text={he.transactions.emptyText}
          action={
            can("upload") ? (
              <Link to="/upload" className="btn btn--primary">
                {he.dashboard.uploadStatement}
              </Link>
            ) : undefined
          }
        />
      ) : (
        <>
          {isPhone ? (
            <div className="filter-bar filter-bar--phone">
              {searchControl}
              <button
                type="button"
                className="filter-btn"
                onClick={() => setSheet(true)}
              >
                <Icon name="filter" size={16} />
                {chips.length > 0
                  ? t(he.transactions.filtersCount, { n: chips.length })
                  : he.transactions.filters}
              </button>
            </div>
          ) : (
            <div className="filter-bar">
              {searchControl}
              <FilterButton
                label={he.transactions.period}
                count={filters.period !== defaultFilters.period ? 1 : 0}
              >
                {(close) => periodControl(close)}
              </FilterButton>
              <FilterButton
                label={he.transactions.category}
                count={filters.categories.length}
              >
                {() => (
                  <MultiSelect
                    label={he.transactions.category}
                    options={categoryOptions}
                    selected={filters.categories}
                    onChange={setCategories}
                    searchable
                  />
                )}
              </FilterButton>
              <FilterButton
                label={he.transactions.member}
                count={filters.members.length}
              >
                {() => (
                  <MultiSelect
                    label={he.transactions.member}
                    options={memberOptions}
                    selected={filters.members}
                    onChange={(ids) => setFilters({ members: ids })}
                  />
                )}
              </FilterButton>
              <FilterButton
                label={he.transactions.account}
                count={filters.accounts.length}
              >
                {() => (
                  <MultiSelect
                    label={he.transactions.account}
                    options={accountOptions}
                    selected={filters.accounts}
                    onChange={(ids) => setFilters({ accounts: ids })}
                  />
                )}
              </FilterButton>
              <FilterButton
                label={he.transactions.tags}
                count={filters.tags.length}
              >
                {() => (
                  <MultiSelect
                    label={he.transactions.tags}
                    options={tagOptions}
                    selected={filters.tags}
                    onChange={(ids) => setFilters({ tags: ids })}
                  />
                )}
              </FilterButton>
              {typeControl}
              <button
                type="button"
                className="btn btn--ghost"
                onClick={clearAll}
                disabled={
                  activeCount === 0 && !filters.showDeleted && !filters.document
                }
              >
                {he.transactions.clearFilters}
              </button>
              <span className="filter-bar__end">{deletedToggle}</span>
            </div>
          )}

          {doc ? (
            <div className="note-bar note-bar--info">
              <Icon name="info" size={18} />
              <span>
                {t(he.transactions.afterIntake, {
                  n: results.length,
                  file: doc.fileName,
                })}
              </span>
              <button
                type="button"
                className="link-btn link-btn--inline"
                onClick={() => setFilters({ document: "" })}
              >
                {he.transactions.showAllTx}
              </button>
            </div>
          ) : null}
          {filters.showDeleted ? (
            <div className="note-bar">
              <Icon name="restore" size={18} />
              <span>{he.transactions.deletedView}</span>
            </div>
          ) : null}

          {chips.length > 0 ? (
            <div className="filter-chips">
              {chips.map((c) => (
                <span key={c.key} className="filter-chip">
                  {t(he.transactions.chip, { label: c.label, value: c.value })}
                  <button
                    type="button"
                    className="icon-btn icon-btn--xs"
                    aria-label={t(he.transactions.removeChip, {
                      label: c.label,
                      value: c.value,
                    })}
                    onClick={c.remove}
                  >
                    <Icon name="close" size={14} />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
          <p className="result-summary" aria-live="polite">
            <bdi>
              {t(he.transactions.summary, {
                n: results.length,
                income: formatAmount(totals.income, { decimals: 0 }),
                expense: formatAmount(-totals.expense, { decimals: 0 }),
              })}
              {totals.transferCount > 0
                ? t(he.transactions.summaryTransfers, {
                    n: totals.transferCount,
                  })
                : ""}
            </bdi>
          </p>
          {filters.categories.length > 0 ? (
            <CoverageNote
              coverage={coverageForRange(
                data.transactions,
                data.coverage,
                data.accounts,
                range.from,
                range.to,
              )}
            />
          ) : null}

          {results.length === 0 ? (
            <EmptyState
              icon="search"
              title={he.transactions.noResults}
              action={
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={clearAll}
                >
                  {he.transactions.clearAll}
                </button>
              }
            />
          ) : (
            <section className="card card--flush">
              {sortedGroups.map((g, index) => {
                const open = isOpen(g.month, index);
                const mt = totalsOf(g.rows);
                const allSelected = g.rows.every((r) => selected.has(r.id));
                return (
                  <div key={g.month} className="month-group">
                    <MonthGroupHeader
                      expanded={open}
                      onToggle={() => toggleMonth(g.month, index)}
                      controls={`tx-month-${g.month}`}
                      title={formatMonth(g.month)}
                      tag={
                        g.month === monthOf(DEMO_TODAY) ? (
                          <span className="chip chip--current">
                            {he.dashboard.currentMonth}
                          </span>
                        ) : null
                      }
                      summary={
                        <bdi>
                          {t(he.dashboard.monthHeader, {
                            income: formatAmount(mt.income, { decimals: 0 }),
                            expense: formatAmount(-mt.expense, { decimals: 0 }),
                            n: g.rows.length,
                          })}
                        </bdi>
                      }
                      leading={
                        editable ? (
                          <input
                            type="checkbox"
                            className="month-header__check"
                            checked={allSelected}
                            aria-label={t(he.transactions.selectMonth, {
                              month: formatMonth(g.month),
                            })}
                            onChange={() =>
                              setSelected((s) => {
                                const n = new Set(s);
                                for (const r of g.rows) {
                                  if (allSelected) n.delete(r.id);
                                  else n.add(r.id);
                                }
                                return n;
                              })
                            }
                          />
                        ) : undefined
                      }
                    />
                    {open ? (
                      <div id={`tx-month-${g.month}`} className="month-body">
                        {isPhone ? (
                          <TransactionCards
                            rows={g.rows}
                            options={{
                              selectable: editable,
                              selected,
                              onToggle: toggleRow,
                              onOpen: (tx) => setDrawerId(tx.id),
                              rowMenu,
                            }}
                          />
                        ) : (
                          <div className="table-scroll">
                            <TransactionTable
                              rows={g.rows}
                              options={{
                                selectable: editable,
                                selected,
                                onToggle: toggleRow,
                                onOpen: (tx) => setDrawerId(tx.id),
                                rowMenu,
                                highlightId: highlight,
                                sortState: (col) =>
                                  sort.col === col
                                    ? sort.dir === "asc"
                                      ? "ascending"
                                      : "descending"
                                    : undefined,
                                sortHeader: (col, label) => (
                                  <button
                                    type="button"
                                    className="sort-btn"
                                    aria-label={t(he.table.sortBy, {
                                      column: label,
                                    })}
                                    onClick={() =>
                                      setSort((s) => ({
                                        col,
                                        dir:
                                          s.col === col && s.dir === "desc"
                                            ? "asc"
                                            : "desc",
                                      }))
                                    }
                                  >
                                    {label}
                                    {sort.col === col ? (
                                      <Icon
                                        name="chevronDown"
                                        size={14}
                                        className={
                                          sort.dir === "asc" ? "icon-up" : ""
                                        }
                                      />
                                    ) : null}
                                  </button>
                                ),
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </section>
          )}
        </>
      )}

      {editable && selected.size > 0 ? (
        <div className="action-bar" role="region" aria-label={he.bulk.label}>
          <span className="action-bar__count">
            {t(he.bulk.selected, { n: selected.size })}
          </span>
          <div className="action-bar__buttons">
            {filters.showDeleted ? (
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => {
                  actions.restore([...selected]);
                  clearSelection();
                }}
              >
                {he.transactions.restore}
              </button>
            ) : (
              <>
                <span className="popover-anchor popover-anchor--up">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    aria-expanded={bulkPanel === "category"}
                    onClick={() =>
                      setBulkPanel((p) =>
                        p === "category" ? null : "category",
                      )
                    }
                  >
                    {he.bulk.changeCategory}
                  </button>
                  {bulkPanel === "category" ? (
                    <Popover
                      label={he.bulk.changeCategory}
                      onClose={() => setBulkPanel(null)}
                    >
                      {otherType > 0 ? (
                        <p className="hint">
                          {t(he.bulk.otherType, { k: otherType })}
                        </p>
                      ) : null}
                      <CategoryPicker
                        type={bulkType}
                        value={null}
                        recent={actions.recentCategories}
                        onChange={(id) => {
                          const ids = fitting.map((x) => x.id);
                          actions.patch(
                            ids,
                            () => ({ categoryId: id }),
                            t(he.bulk.categoryApplied, { n: ids.length }),
                          );
                          clearSelection();
                        }}
                      />
                    </Popover>
                  ) : null}
                </span>
                <span className="popover-anchor popover-anchor--up">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    aria-expanded={bulkPanel === "assign"}
                    onClick={() => {
                      setBulkMembers({ m: [], t: [] });
                      setBulkPanel((p) => (p === "assign" ? null : "assign"));
                    }}
                  >
                    {he.bulk.assign}
                  </button>
                  {bulkPanel === "assign" ? (
                    <Popover
                      label={he.bulk.assign}
                      onClose={() => setBulkPanel(null)}
                    >
                      <MemberTagPicker
                        members={data.members}
                        tags={data.tags}
                        memberIds={bulkMembers.m}
                        tagIds={bulkMembers.t}
                        onChange={(m, tg) => setBulkMembers({ m, t: tg })}
                        onCreateTag={actions.createTag}
                      />
                      <div className="popover__footer">
                        <button
                          type="button"
                          className="btn btn--primary btn--sm"
                          onClick={() => {
                            const ids = [...selected];
                            actions.patch(
                              ids,
                              (x) => ({
                                memberIds: [
                                  ...new Set([
                                    ...x.memberIds,
                                    ...bulkMembers.m,
                                  ]),
                                ],
                                tagIds: [
                                  ...new Set([...x.tagIds, ...bulkMembers.t]),
                                ],
                              }),
                              t(he.bulk.assignApplied, { n: ids.length }),
                            );
                            clearSelection();
                          }}
                        >
                          {he.common.save}
                        </button>
                      </div>
                    </Popover>
                  ) : null}
                </span>
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={() => {
                    const ids = selectedTx
                      .filter((x) => !isCardCharge(x))
                      .map((x) => x.id);
                    actions.patch(
                      ids,
                      () => ({ type: "transfer" as TxType, categoryId: null }),
                      t(he.bulk.transferApplied, { n: ids.length }),
                    );
                    clearSelection();
                  }}
                >
                  {he.bulk.markTransfer}
                </button>
                <button
                  type="button"
                  className="btn btn--danger"
                  onClick={() => {
                    const ids = [...selected];
                    if (ids.length > 1) setConfirmDelete(ids);
                    else {
                      actions.remove(ids);
                      clearSelection();
                    }
                  }}
                >
                  {he.bulk.delete}
                </button>
              </>
            )}
            <button
              type="button"
              className="btn btn--ghost"
              onClick={clearSelection}
            >
              {he.bulk.clearSelection}
            </button>
          </div>
        </div>
      ) : null}

      {sheet ? (
        <Modal
          title={he.transactions.filters}
          onClose={() => setSheet(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={clearAll}
              >
                {he.transactions.clearFilters}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => setSheet(false)}
              >
                {t(he.transactions.showResults, { n: results.length })}
              </button>
            </>
          }
        >
          <div className="sheet-sections">
            <section>
              <h3 className="field-label">{he.transactions.period}</h3>
              {periodControl()}
            </section>
            <section>
              <h3 className="field-label">{he.transactions.type}</h3>
              {typeControl}
            </section>
            <section>
              <h3 className="field-label">{he.transactions.category}</h3>
              <MultiSelect
                label={he.transactions.category}
                options={categoryOptions}
                selected={filters.categories}
                onChange={setCategories}
              />
            </section>
            <section>
              <h3 className="field-label">{he.transactions.member}</h3>
              <MultiSelect
                label={he.transactions.member}
                options={memberOptions}
                selected={filters.members}
                onChange={(ids) => setFilters({ members: ids })}
              />
            </section>
            <section>
              <h3 className="field-label">{he.transactions.account}</h3>
              <MultiSelect
                label={he.transactions.account}
                options={accountOptions}
                selected={filters.accounts}
                onChange={(ids) => setFilters({ accounts: ids })}
              />
            </section>
            <section>
              <h3 className="field-label">{he.transactions.tags}</h3>
              <MultiSelect
                label={he.transactions.tags}
                options={tagOptions}
                selected={filters.tags}
                onChange={(ids) => setFilters({ tags: ids })}
              />
            </section>
            {deletedToggle}
          </div>
        </Modal>
      ) : null}

      {confirmDelete ? (
        <Modal
          title={he.common.delete}
          size="sm"
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setConfirmDelete(null)}
              >
                {he.common.cancel}
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => {
                  actions.remove(confirmDelete);
                  setConfirmDelete(null);
                  clearSelection();
                }}
              >
                {he.common.delete}
              </button>
            </>
          }
        >
          <p>
            {t(he.transactions.confirmBulkDelete, { n: confirmDelete.length })}
          </p>
        </Modal>
      ) : null}

      {drawerTx ? (
        <TransactionEditDrawer
          tx={drawerTx}
          onClose={() => setDrawerId(null)}
          onSaved={setHighlight}
        />
      ) : null}
    </div>
  );
}

function RowMenu({
  tx,
  editable,
  onEdit,
  onDelete,
  onRestore,
}: {
  tx: Transaction;
  editable: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onRestore: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (!editable) return null;
  return (
    <span className="popover-anchor popover-anchor--end">
      <button
        type="button"
        className="icon-btn"
        aria-label={t(he.table.rowMenu, { description: tx.description })}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="more" />
      </button>
      {open ? (
        <Popover
          label={t(he.table.rowMenu, { description: tx.description })}
          onClose={() => setOpen(false)}
          className="menu"
        >
          {tx.deletedAt ? (
            <button
              type="button"
              className="menu__item"
              onClick={() => {
                setOpen(false);
                onRestore();
              }}
            >
              <Icon name="restore" size={16} />
              {he.transactions.restore}
            </button>
          ) : (
            <>
              <button
                type="button"
                className="menu__item"
                onClick={() => {
                  setOpen(false);
                  onEdit();
                }}
              >
                <Icon name="edit" size={16} />
                {he.common.edit}
              </button>
              <button
                type="button"
                className="menu__item menu__item--danger"
                onClick={() => {
                  setOpen(false);
                  onDelete();
                }}
              >
                <Icon name="trash" size={16} />
                {he.common.delete}
              </button>
            </>
          )}
        </Popover>
      ) : null}
    </span>
  );
}

function ShortcutsButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="icon-btn"
        aria-label={he.transactions.shortcuts}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name="keyboard" />
      </button>
      {open ? (
        <Popover
          label={he.transactions.shortcuts}
          onClose={() => setOpen(false)}
          className="popover--text"
        >
          <p>{he.transactions.shortcutsList}</p>
        </Popover>
      ) : null}
    </>
  );
}
