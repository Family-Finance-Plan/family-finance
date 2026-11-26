/** "לאן הלך הכסף": horizontal bar list per category group, with the mandatory CoverageNote (ADR-004). */
import { useState } from "react";
import { Icon } from "../../components/Icon";
import { Popover } from "../../components/overlays";
import { Amount } from "../../components/primitives";
import { formatMonth, t } from "../../lib/format";
import { Link } from "../../lib/router";
import type { Breakdown, Coverage } from "../../lib/selectors";
import { he } from "../../locale/he";

export function CoverageNote({
  coverage,
  type = "expense",
}: {
  coverage: Coverage;
  type?: "income" | "expense";
}) {
  const [open, setOpen] = useState(false);
  const text =
    type === "expense"
      ? t(he.dashboard.coverage, {
          p: coverage.percent,
          n: coverage.accountsWithData,
          total: coverage.totalAccounts,
        })
      : t(he.dashboard.coverageIncome, {
          n: coverage.accountsWithData,
          total: coverage.totalAccounts,
        });
  return (
    <p className="coverage-note">
      <span>{text}</span>
      <span className="popover-anchor">
        <button
          type="button"
          className="icon-btn icon-btn--xs"
          aria-label={he.dashboard.coverageInfo}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name="info" size={16} />
        </button>
        {open ? (
          <Popover
            label={he.dashboard.coverageInfo}
            onClose={() => setOpen(false)}
            className="popover--text"
          >
            <p>{he.dashboard.coverageExplain}</p>
          </Popover>
        ) : null}
      </span>
    </p>
  );
}

const TOP = 6;

export function CategoryBreakdown({
  month,
  type,
  onTypeChange,
  breakdown,
  coverage,
  activeCategory,
  onSelectCategory,
  isFuture,
}: {
  month: string;
  type: "income" | "expense";
  onTypeChange: (t: "income" | "expense") => void;
  breakdown: Breakdown;
  coverage: Coverage;
  activeCategory: string | null;
  onSelectCategory: (id: string) => void;
  isFuture: boolean;
}) {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? breakdown.rows : breakdown.rows.slice(0, TOP);
  const hidden = breakdown.rows.length - rows.length;
  const max = Math.max(
    1,
    ...breakdown.rows.map((r) => r.amount),
    breakdown.notItemized,
    breakdown.uncategorized,
  );
  const width = (amount: number) =>
    `${Math.max(2, Math.round((amount * 100) / max))}%`;
  const empty =
    breakdown.rows.length === 0 &&
    breakdown.notItemized === 0 &&
    breakdown.uncategorized === 0;
  return (
    <section className="card breakdown" aria-labelledby="breakdown-title">
      <div className="card__header">
        <h2 id="breakdown-title" className="card__title">
          {t(
            type === "expense"
              ? he.dashboard.breakdownTitle
              : he.dashboard.incomeSourcesTitle,
            { month: formatMonth(month) },
          )}
        </h2>
        <div
          className="segmented"
          role="group"
          aria-label={he.dashboard.breakdownToggle}
        >
          {(["expense", "income"] as const).map((k) => (
            <button
              key={k}
              type="button"
              aria-pressed={type === k}
              className={type === k ? "is-on" : ""}
              onClick={() => onTypeChange(k)}
            >
              {k === "expense" ? he.dashboard.expenses : he.dashboard.income}
            </button>
          ))}
        </div>
      </div>
      <CoverageNote coverage={coverage} type={type} />
      {empty || isFuture ? (
        <p className="muted breakdown__empty">
          {type === "expense" ? he.dashboard.noExpenses : he.dashboard.noIncome}
        </p>
      ) : (
        <ul className="breakdown__list">
          {rows.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                className={`breakdown__row ${activeCategory === r.id ? "is-active" : ""}`}
                aria-pressed={activeCategory === r.id}
                onClick={() => onSelectCategory(r.id)}
              >
                <span className="breakdown__name">{r.name}</span>
                <span className="breakdown__bar" aria-hidden="true">
                  <span
                    className={`breakdown__fill breakdown__fill--${type}`}
                    style={{ inlineSize: width(r.amount) }}
                  />
                </span>
                <span className="breakdown__value">
                  <Amount agorot={r.amount} decimals={0} />
                  <span className="muted breakdown__pct">
                    <bdi>{r.percent}%</bdi>
                  </span>
                </span>
              </button>
            </li>
          ))}
          {hidden > 0 || showAll ? (
            <li>
              <button
                type="button"
                className="link-btn"
                onClick={() => setShowAll((s) => !s)}
                aria-expanded={showAll}
              >
                {showAll
                  ? he.dashboard.fewerCategories
                  : t(he.dashboard.moreCategories, { n: hidden })}
              </button>
            </li>
          ) : null}
          {breakdown.uncategorized > 0 ? (
            <li className="breakdown__row breakdown__row--static">
              <span className="breakdown__name">{he.status.uncategorized}</span>
              <span className="breakdown__bar" aria-hidden="true">
                <span
                  className="breakdown__fill breakdown__fill--uncategorized"
                  style={{ inlineSize: width(breakdown.uncategorized) }}
                />
              </span>
              <span className="breakdown__value">
                <Amount agorot={breakdown.uncategorized} decimals={0} />
                <Link
                  to="/transactions?category=none"
                  className="breakdown__link"
                >
                  {he.dashboard.classify}
                </Link>
              </span>
            </li>
          ) : null}
          {breakdown.notItemized > 0 ? (
            <li className="breakdown__row breakdown__row--static breakdown__row--not-itemized">
              <span className="breakdown__name">
                <Icon name="card" size={16} />
                {he.status.notItemized}
              </span>
              <span className="breakdown__bar" aria-hidden="true">
                <span
                  className="breakdown__fill breakdown__fill--not-itemized"
                  style={{ inlineSize: width(breakdown.notItemized) }}
                />
              </span>
              <span className="breakdown__value">
                <Amount agorot={breakdown.notItemized} decimals={0} />
                <span className="muted breakdown__pct">
                  {he.dashboard.cardHint}
                </span>
              </span>
            </li>
          ) : null}
        </ul>
      )}
    </section>
  );
}
