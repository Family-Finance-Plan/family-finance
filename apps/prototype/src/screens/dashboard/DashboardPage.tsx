/** Main Dashboard (dashboard.md): summary cards, Timeline, category breakdown, monthly table. */
import { useMemo, useState } from "react";
import { PageHeader } from "../../components/AppShell";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonRows,
} from "../../components/feedback";
import { Icon } from "../../components/Icon";
import { categoryLabel } from "../../components/pickers";
import {
  Amount,
  CertaintyBadge,
  Chip,
  DateCell,
} from "../../components/primitives";
import { TransactionEditDrawer } from "../../components/TransactionEditDrawer";
import {
  AssignmentChips,
  MonthGroupHeader,
  TransactionCards,
  TransactionTable,
} from "../../components/TransactionTable";
import { getCategory, reportingGroup } from "../../demo/categories";
import { DEMO_TODAY } from "../../demo/demo-today";
import type { Certainty, FutureItem, Transaction } from "../../demo/types";
import {
  addMonths,
  daysInMonth,
  formatAmount,
  formatDate,
  formatMonth,
  formatMonthName,
  monthOf,
  t,
} from "../../lib/format";
import { Link, withQuery } from "../../lib/router";
import { useLocation } from "../../lib/router";
import {
  categoryBreakdown,
  completeness,
  coverageForMonth,
  groupByMonth,
  isActive,
  monthEnd,
  monthRange,
  monthStart,
  monthTotals,
} from "../../lib/selectors";
import { PHONE_QUERY, useMediaQuery } from "../../lib/useMediaQuery";
import { he } from "../../locale/he";
import {
  futureAmount,
  futureCertainty,
  setTemporaryEstimate,
} from "../../state/household-data";
import { useCurrent } from "../../state/store";
import { useToast } from "../../components/feedback";
import { FutureAmountDialog } from "./FutureAmountDialog";
import { CategoryBreakdown } from "./CategoryBreakdown";
import { type ChartMonth, TimelineChart } from "./TimelineChart";

const CURRENT_MONTH = monthOf(DEMO_TODAY);
const MAX_ROWS = 20;
const CERTAINTIES: Certainty[] = ["verified", "expected", "estimate"];

type TableFilter =
  { kind: "category"; id: string } | { kind: "transfers" } | null;

function emptyCertainty(): Record<Certainty, number> {
  return { verified: 0, expected: 0, estimate: 0 };
}

function futureByMonth(items: readonly FutureItem[], ym: string) {
  const income = emptyCertainty();
  const expense = emptyCertainty();
  for (const f of items) {
    if (monthOf(f.date) !== ym) continue;
    const target = f.type === "income" ? income : expense;
    target[futureCertainty(f)] += futureAmount(f);
  }
  return { income, expense };
}

function SummaryCards({
  month,
  transactions,
  future,
}: {
  month: string;
  transactions: readonly Transaction[];
  future: ReturnType<typeof futureByMonth> | null;
}) {
  if (future) {
    const lines = (r: Record<Certainty, number>) => (
      <ul className="certainty-lines">
        {CERTAINTIES.map((c) => (
          <li key={c}>
            <CertaintyBadge certainty={c} />
            <Amount agorot={r[c]} decimals={0} muted />
          </li>
        ))}
      </ul>
    );
    return (
      <div className="summary-cards">
        <section className="card summary-card" aria-labelledby="sc-income">
          <h2 id="sc-income" className="summary-card__label">
            {he.dashboard.income}{" "}
            <span className="chip chip--preview">{he.dashboard.phase2}</span>
          </h2>
          {lines(future.income)}
        </section>
        <section className="card summary-card" aria-labelledby="sc-expense">
          <h2 id="sc-expense" className="summary-card__label">
            {he.dashboard.expenses}{" "}
            <span className="chip chip--preview">{he.dashboard.phase2}</span>
          </h2>
          {lines(future.expense)}
        </section>
        <section className="card summary-card summary-card--note">
          <p className="muted">{he.dashboard.forecastCaption}</p>
        </section>
      </div>
    );
  }
  const totals = monthTotals(transactions, month);
  const prev = monthTotals(transactions, addMonths(month, -1));
  const noData = totals.count === 0;
  const hasPrev = prev.count > 0;
  return (
    <>
      <div className="summary-cards">
        <section className="card summary-card" aria-labelledby="sc-income">
          <h2 id="sc-income" className="summary-card__label">
            {he.dashboard.income}
          </h2>
          <p className="summary-card__value">
            {noData ? (
              he.common.none
            ) : (
              <Amount agorot={totals.income} type="income" decimals={0} />
            )}
          </p>
          <p className="summary-card__sub">
            {noData
              ? he.dashboard.noDataForMonth
              : t(he.dashboard.txCount, { n: totals.incomeCount })}
          </p>
        </section>
        <section className="card summary-card" aria-labelledby="sc-expense">
          <h2 id="sc-expense" className="summary-card__label">
            {he.dashboard.expenses}
          </h2>
          <p className="summary-card__value">
            {noData ? (
              he.common.none
            ) : (
              <Amount agorot={totals.expense} type="expense" decimals={0} />
            )}
          </p>
          <p className="summary-card__sub">
            {noData
              ? he.dashboard.noDataForMonth
              : t(he.dashboard.txCount, { n: totals.expenseCount })}
          </p>
        </section>
        <section className="card summary-card" aria-labelledby="sc-balance">
          <h2 id="sc-balance" className="summary-card__label">
            {he.dashboard.balance}
          </h2>
          <p className="summary-card__value">
            {noData ? (
              he.common.none
            ) : (
              <Amount agorot={totals.balance} type="balance" decimals={0} />
            )}
          </p>
          <p className="summary-card__sub">
            {noData
              ? he.dashboard.noDataForMonth
              : hasPrev
                ? t(he.dashboard.vsPrev, {
                    month: formatMonthName(addMonths(month, -1)),
                    delta: formatAmount(totals.balance - prev.balance, {
                      decimals: 0,
                    }),
                  })
                : " "}
          </p>
        </section>
      </div>
    </>
  );
}

function FutureRows({
  items,
  editable,
  onEdit,
}: {
  items: readonly FutureItem[];
  editable: boolean;
  onEdit: (f: FutureItem) => void;
}) {
  const { data, update } = useCurrent();
  const toast = useToast();
  return (
    <>
      {items.map((f) => {
        const certainty = futureCertainty(f);
        return (
          <tr
            key={f.id}
            className={`tx-row future-row future-row--${certainty}`}
          >
            <td className="col-date">
              <DateCell date={f.date} />
            </td>
            <td>
              <div className="tx-desc">{f.description}</div>
              {f.temporaryEstimate ? (
                <div className="tx-sub">
                  <span className="chip chip--outline">
                    {he.dashboard.temporary}
                  </span>{" "}
                  <button
                    type="button"
                    className="link-btn link-btn--inline"
                    onClick={() => {
                      update((d) => setTemporaryEstimate(d, f.id, null));
                      toast.show(he.dashboard.estimateCancelled);
                    }}
                  >
                    {he.dashboard.cancelEstimate}
                  </button>
                </div>
              ) : null}
            </td>
            <td className="col-cat">
              {f.categoryId ? (
                <Chip>{categoryLabel(f.categoryId)}</Chip>
              ) : (
                <span className="muted">{he.status.notItemized}</span>
              )}
            </td>
            <td className="col-assign">
              <AssignmentChips
                memberIds={f.memberIds}
                tagIds={[]}
                members={data.members}
                tags={data.tags}
              />
            </td>
            <td className="col-type">
              <CertaintyBadge certainty={certainty} />
            </td>
            <td className="col-amount">
              {editable ? (
                <button
                  type="button"
                  className="amount-edit"
                  onClick={() => onEdit(f)}
                  aria-label={`${he.dashboard.editFutureAmount}: ${f.description}`}
                >
                  <Amount agorot={futureAmount(f)} type={f.type} muted />
                  <Icon name="edit" size={14} />
                </button>
              ) : (
                <Amount agorot={futureAmount(f)} type={f.type} muted />
              )}
            </td>
          </tr>
        );
      })}
    </>
  );
}

export function DashboardPage() {
  const { data, can } = useCurrent();
  const { query } = useLocation();
  const isPhone = useMediaQuery(PHONE_QUERY);
  const [retried, setRetried] = useState(false);
  const forced = retried ? null : query.get("state");
  const [selected, setSelected] = useState(CURRENT_MONTH);
  const [preview, setPreview] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([CURRENT_MONTH]),
  );
  const [breakdownType, setBreakdownType] = useState<"income" | "expense">(
    "expense",
  );
  const [filter, setFilter] = useState<TableFilter>(null);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [futureEdit, setFutureEdit] = useState<FutureItem | null>(null);

  const transactions = data.transactions;
  const active = useMemo(() => transactions.filter(isActive), [transactions]);
  const pastMonths = monthRange(active, CURRENT_MONTH);
  const futureMonths = preview
    ? [addMonths(CURRENT_MONTH, 1), addMonths(CURRENT_MONTH, 2)]
    : [];
  const allMonths = [...pastMonths, ...futureMonths];
  const selectedMonth = allMonths.includes(selected) ? selected : CURRENT_MONTH;
  const isFutureMonth = selectedMonth > CURRENT_MONTH;
  const idx = allMonths.indexOf(selectedMonth);

  const select = (ym: string, fromChart = false) => {
    setSelected(ym);
    setFilter(null);
    setExpanded((e) => new Set([...e, ym]));
    if (fromChart) {
      setTimeout(
        () =>
          document
            .getElementById(`month-${ym}`)
            ?.scrollIntoView({ block: "nearest", behavior: "smooth" }),
        0,
      );
    }
  };
  const togglePreview = (on: boolean) => {
    setPreview(on);
    if (!on && selected > CURRENT_MONTH) setSelected(CURRENT_MONTH);
  };

  const header = (
    <PageHeader title={he.dashboard.title}>
      <div className="month-selector">
        {/* In RTL "previous" sits at inline-start (right) and points right. */}
        <button
          type="button"
          className="icon-btn"
          aria-label={he.dashboard.prevMonth}
          disabled={idx <= 0}
          onClick={() => select(allMonths[idx - 1] ?? selectedMonth)}
        >
          <Icon name="chevron" />
        </button>
        <span className="month-selector__label" aria-live="polite">
          {formatMonth(selectedMonth)}
        </span>
        <button
          type="button"
          className="icon-btn"
          aria-label={he.dashboard.nextMonth}
          disabled={idx >= allMonths.length - 1}
          onClick={() => select(allMonths[idx + 1] ?? selectedMonth)}
        >
          <Icon name="chevron" directional />
        </button>
      </div>
      {can("upload") && !isPhone ? (
        <Link to="/upload" className="btn btn--primary">
          <Icon name="upload" size={18} />
          {he.dashboard.upload}
        </Link>
      ) : null}
    </PageHeader>
  );

  if (forced === "loading") {
    return (
      <div className="page" aria-busy="true">
        {header}
        <div className="summary-cards">
          {[0, 1, 2].map((i) => (
            <div key={i} className="card summary-card">
              <Skeleton inline="40%" />
              <Skeleton inline="70%" block={32} />
              <Skeleton inline="30%" />
            </div>
          ))}
        </div>
        <div className="dash-grid">
          <div className="card">
            <Skeleton block={220} />
          </div>
          <div className="card">
            <SkeletonRows rows={5} />
          </div>
        </div>
        <div className="card">
          <SkeletonRows rows={6} />
        </div>
      </div>
    );
  }
  if (forced === "error") {
    return (
      <div className="page">
        {header}
        <ErrorState
          message={he.dashboard.error}
          onRetry={() => setRetried(true)}
        />
      </div>
    );
  }
  const waiting = data.documents.filter((d) => d.status === "awaiting-review");
  if (forced === "empty" || active.length === 0) {
    return (
      <div className="page">
        <PageHeader title={he.dashboard.title} />
        <EmptyState
          icon="chart"
          title={he.dashboard.emptyTitle}
          text={he.dashboard.emptyText}
          action={
            can("upload") ? (
              <Link to="/upload" className="btn btn--primary">
                {he.dashboard.uploadStatement}
              </Link>
            ) : undefined
          }
          secondary={
            waiting.length > 0 && waiting[0] ? (
              <Link
                to={`/upload/${waiting[0].id}/review`}
                className="btn btn--secondary"
              >
                {t(he.dashboard.emptyWaiting, { n: waiting.length })}
              </Link>
            ) : undefined
          }
        />
      </div>
    );
  }

  const comp = completeness(data.coverage, data.accounts, selectedMonth);
  const coverage = coverageForMonth(
    active,
    data.coverage,
    data.accounts,
    selectedMonth,
  );
  const breakdown = categoryBreakdown(active, selectedMonth, breakdownType);
  const totals = monthTotals(active, selectedMonth);
  const chartMonths: ChartMonth[] = [
    ...pastMonths.slice(-6).map((ym) => {
      const m = monthTotals(active, ym);
      return {
        ym,
        income: m.income,
        expense: m.expense,
        isCurrent: ym === CURRENT_MONTH,
      };
    }),
    ...futureMonths.map((ym) => ({
      ym,
      income: 0,
      expense: 0,
      isCurrent: false,
      future: futureByMonth(data.futureItems, ym),
    })),
  ];
  const today = Number(DEMO_TODAY.slice(8, 10));
  const todayFraction = today / daysInMonth(CURRENT_MONTH);

  const groups = groupByMonth(active);
  const tableMonths = futureMonths.toReversed().concat(pastMonths.toReversed());
  const toggle = (ym: string) =>
    setExpanded((e) => {
      const next = new Set(e);
      if (next.has(ym)) next.delete(ym);
      else next.add(ym);
      return next;
    });
  const drawerTx = drawerId
    ? transactions.find((x) => x.id === drawerId)
    : undefined;
  const filterLabel =
    filter?.kind === "category"
      ? (getCategory(filter.id)?.name ?? filter.id)
      : filter?.kind === "transfers"
        ? he.types.transferPlural
        : "";

  const rowsFor = (ym: string): Transaction[] => {
    let rows = groups.find((g) => g.month === ym)?.rows ?? [];
    if (ym === selectedMonth && filter) {
      rows =
        filter.kind === "transfers"
          ? rows.filter((r) => r.type === "transfer")
          : rows.filter(
              (r) =>
                r.categoryId !== null &&
                (r.categoryId === filter.id ||
                  reportingGroup(r.categoryId)?.id === filter.id),
            );
    }
    return rows;
  };

  return (
    <div className="page">
      {header}
      {!comp.complete && !isFutureMonth && comp.lastDate ? (
        <div className="note-bar">
          <Icon name="info" size={18} />
          <span>
            {t(he.dashboard.incomplete, {
              month: formatMonth(selectedMonth),
              n: comp.withData,
              total: comp.total,
              date: formatDate(comp.lastDate),
            })}
          </span>
          {can("upload") ? (
            <Link to="/upload">{he.dashboard.uploadStatement}</Link>
          ) : null}
        </div>
      ) : null}

      <SummaryCards
        month={selectedMonth}
        transactions={active}
        future={
          isFutureMonth ? futureByMonth(data.futureItems, selectedMonth) : null
        }
      />
      {!isFutureMonth && totals.transferCount > 0 ? (
        <p className="transfers-line muted">
          <Icon name="transfer" size={16} />
          {t(he.dashboard.transfersExcluded, { n: totals.transferCount })}{" "}
          <button
            type="button"
            className="link-btn link-btn--inline"
            onClick={() => {
              setFilter({ kind: "transfers" });
              setExpanded((e) => new Set([...e, selectedMonth]));
            }}
          >
            {he.dashboard.showTransfers}
          </button>
        </p>
      ) : null}

      <div className="dash-grid">
        <section className="card" aria-labelledby="chart-title">
          <div className="card__header">
            <h2 id="chart-title" className="card__title">
              {he.dashboard.chartTitle}
            </h2>
          </div>
          <TimelineChart
            months={chartMonths}
            selected={selectedMonth}
            onSelect={(ym) => select(ym, true)}
            today={DEMO_TODAY}
            todayFraction={todayFraction}
            preview={preview}
          />
          <label className="switch-row forecast-toggle">
            <input
              type="checkbox"
              role="switch"
              aria-checked={preview}
              checked={preview}
              onChange={(e) => togglePreview(e.target.checked)}
            />
            <span>{he.dashboard.forecastToggle}</span>
            <span className="chip chip--preview">{he.dashboard.notInV01}</span>
            <span className="chip chip--preview">{he.dashboard.phase2}</span>
          </label>
        </section>
        <CategoryBreakdown
          month={selectedMonth}
          type={breakdownType}
          onTypeChange={setBreakdownType}
          breakdown={breakdown}
          coverage={coverage}
          activeCategory={filter?.kind === "category" ? filter.id : null}
          onSelectCategory={(id) => {
            setFilter((f) =>
              f?.kind === "category" && f.id === id
                ? null
                : { kind: "category", id },
            );
            setExpanded((e) => new Set([...e, selectedMonth]));
          }}
          isFuture={isFutureMonth}
        />
      </div>

      <section className="card card--flush" aria-labelledby="table-title">
        <div className="card__header card__header--padded">
          <h2 id="table-title" className="card__title">
            {he.dashboard.tableTitle}
          </h2>
          {filter ? (
            <div className="filter-chips">
              <span className="filter-chip">
                {t(he.dashboard.filterChip, { category: filterLabel })}
                <button
                  type="button"
                  className="icon-btn icon-btn--xs"
                  aria-label={t(he.dashboard.removeFilter, {
                    category: filterLabel,
                  })}
                  onClick={() => setFilter(null)}
                >
                  <Icon name="close" size={14} />
                </button>
              </span>
              {filter.kind === "category" ? (
                <Link
                  to={withQuery("/transactions", {
                    category: filter.id,
                    month: selectedMonth,
                  })}
                  className="link-btn link-btn--inline"
                >
                  {he.dashboard.openInTransactions}
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>
        {tableMonths.map((ym) => {
          const isFuture = ym > CURRENT_MONTH;
          const open = expanded.has(ym);
          const rows = isFuture ? [] : rowsFor(ym);
          const mt = monthTotals(active, ym);
          const futureItems = data.futureItems
            .filter((f) =>
              isFuture
                ? monthOf(f.date) === ym
                : preview &&
                  ym === CURRENT_MONTH &&
                  monthOf(f.date) === ym &&
                  f.date > DEMO_TODAY,
            )
            .toSorted((a, b) => a.date.localeCompare(b.date));
          const fut = isFuture ? futureByMonth(data.futureItems, ym) : null;
          const summary = fut
            ? CERTAINTIES.map(
                (c) =>
                  `${he.certainty[c]} ${formatAmount(fut.income[c] - fut.expense[c], { decimals: 0 })}`,
              ).join(" · ")
            : t(he.dashboard.monthHeader, {
                income: formatAmount(mt.income, { decimals: 0 }),
                expense: formatAmount(-mt.expense, { decimals: 0 }),
                n: mt.count,
              });
          const shown = rows.slice(0, MAX_ROWS);
          return (
            <div key={ym} className="month-group" id={`month-${ym}`}>
              <MonthGroupHeader
                expanded={open}
                onToggle={() => toggle(ym)}
                controls={`month-body-${ym}`}
                title={
                  isFuture
                    ? t(he.dashboard.forecastMonth, { month: formatMonth(ym) })
                    : formatMonth(ym)
                }
                tag={
                  ym === CURRENT_MONTH ? (
                    <span className="chip chip--current">
                      {he.dashboard.currentMonth}
                    </span>
                  ) : null
                }
                summary={<bdi>{summary}</bdi>}
              />
              {open ? (
                <div id={`month-body-${ym}`} className="month-body">
                  {rows.length === 0 && futureItems.length === 0 ? (
                    <p className="muted month-empty">
                      {he.dashboard.noTxInMonth}
                    </p>
                  ) : isPhone ? (
                    <TransactionCards
                      rows={shown}
                      options={{ onOpen: (tx) => setDrawerId(tx.id) }}
                    />
                  ) : (
                    <div className="table-scroll">
                      <TransactionTable
                        rows={shown}
                        options={{
                          onOpen: (tx) => setDrawerId(tx.id),
                          after:
                            futureItems.length > 0 ? (
                              <>
                                {!isFuture ? (
                                  <tr className="today-divider">
                                    <td colSpan={6}>
                                      <span>
                                        {t(he.dashboard.todayMarker, {
                                          date: formatDate(DEMO_TODAY),
                                        })}
                                      </span>
                                    </td>
                                  </tr>
                                ) : null}
                                <FutureRows
                                  items={futureItems}
                                  editable={can("editTransactions")}
                                  onEdit={setFutureEdit}
                                />
                              </>
                            ) : null,
                        }}
                      />
                    </div>
                  )}
                  {rows.length > MAX_ROWS ? (
                    <Link
                      className="link-btn month-more"
                      to={withQuery("/transactions", {
                        month: ym,
                        period: "custom",
                        from: monthStart(ym),
                        to: monthEnd(ym),
                      })}
                    >
                      {t(he.dashboard.showAllInMonth, { n: rows.length })}
                    </Link>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </section>

      {drawerTx ? (
        <TransactionEditDrawer
          tx={drawerTx}
          onClose={() => setDrawerId(null)}
        />
      ) : null}
      {futureEdit ? (
        <FutureAmountDialog
          item={futureEdit}
          onClose={() => setFutureEdit(null)}
        />
      ) : null}
    </div>
  );
}
