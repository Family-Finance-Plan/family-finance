/**
 * Monthly income vs expense bars, hand-rolled SVG (dashboard.md TimelineChart).
 * Time runs left to right (owner decision 2); the Y axis sits on the inline-start (right) side.
 * Red/green fail colour-blind separation, so expense bars also carry a hatch texture and every
 * month has a text readout and a visually hidden data table.
 */
import { type KeyboardEvent, useId, useState } from "react";
import type { Certainty } from "../../demo/types";
import {
  formatAmount,
  formatCompactShekels,
  formatDate,
  formatMonth,
  formatMonthShort,
  t,
} from "../../lib/format";
import { he } from "../../locale/he";

export interface ChartMonth {
  ym: string;
  income: number;
  expense: number;
  isCurrent: boolean;
  /** Preview layer only: future amounts per certainty, never mixed (R-009). */
  future?: {
    income: Record<Certainty, number>;
    expense: Record<Certainty, number>;
  };
}

const W = 680;
const H = 260;
// `start` is the right side (Y labels, inline-start in RTL); `end` the left side.
const PAD = { start: 72, end: 12, top: 34, bottom: 46 };
const CERTAINTIES: Certainty[] = ["verified", "expected", "estimate"];

function niceStep(maxAgorot: number): number {
  const candidates = [
    1000, 2000, 2500, 5000, 10000, 20000, 25000, 50000, 100000,
  ].map((s) => s * 100);
  const raw = Math.ceil(maxAgorot / 4);
  return (
    candidates.find((c) => c >= raw) ??
    candidates[candidates.length - 1] ??
    100000
  );
}

const sum = (r: Record<Certainty, number>): number =>
  r.verified + r.expected + r.estimate;

export function monthSummary(m: ChartMonth): string {
  const f0 = (a: number) => formatAmount(a, { decimals: 0, sign: "none" });
  if (m.future) {
    const join = (r: Record<Certainty, number>) => ({
      verified: f0(r.verified),
      expected: f0(r.expected),
      estimate: f0(r.estimate),
    });
    return `${t(he.dashboard.chartFutureSummary, { month: formatMonth(m.ym), ...join(m.future.income) })} (${he.types.incomePlural}); ${t(
      he.dashboard.chartFutureSummary,
      { month: formatMonth(m.ym), ...join(m.future.expense) },
    )} (${he.types.expensePlural})`;
  }
  return t(he.dashboard.chartMonthSummary, {
    month: formatMonth(m.ym),
    income: f0(m.income),
    expense: f0(m.expense),
    balance: formatAmount(m.income - m.expense, { decimals: 0 }),
  });
}

export function TimelineChart({
  months,
  selected,
  onSelect,
  today,
  todayFraction,
  preview,
}: {
  months: ChartMonth[];
  selected: string;
  onSelect: (ym: string) => void;
  today: string;
  /** Position of today inside the current month, 0..1. */
  todayFraction: number;
  preview: boolean;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const hatchId = useId().replace(/:/g, "");
  const n = Math.max(months.length, 1);
  const plotW = W - PAD.start - PAD.end;
  const plotH = H - PAD.top - PAD.bottom;
  const maxValue = Math.max(
    1,
    ...months.map((m) =>
      m.future
        ? Math.max(sum(m.future.income), sum(m.future.expense))
        : Math.max(m.income, m.expense),
    ),
  );
  const step = niceStep(maxValue);
  const yMax = step * 4;
  const y = (v: number) => PAD.top + plotH - Math.round((v * plotH) / yMax);
  const groupW = plotW / n;
  // Months are laid out left to right in time order (SVG x axis), regardless of RTL.
  const gx = (i: number) => PAD.end + i * groupW;
  const barW = Math.min(30, groupW * 0.26);
  const gap = 6;
  const currentIndex = months.findIndex((m) => m.isCurrent);
  const todayX =
    currentIndex >= 0 ? gx(currentIndex) + groupW * todayFraction : null;
  const readout =
    months.find((m) => m.ym === (hover ?? selected)) ??
    months[months.length - 1];

  const onKey = (e: KeyboardEvent<SVGGElement>, i: number) => {
    const target =
      e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : -1;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const m = months[i];
      if (m) onSelect(m.ym);
      return;
    }
    if (target >= 0 && target < months.length) {
      e.preventDefault();
      const groups =
        (e.currentTarget.parentElement?.querySelectorAll<SVGGElement>(
          "g.chart-group",
        ) ?? []) as ArrayLike<SVGGElement>;
      groups[target]?.focus();
    }
  };

  const stack = (
    x: number,
    values: Record<Certainty, number>,
    kind: "income" | "expense",
  ) => {
    let base = 0;
    return CERTAINTIES.map((c) => {
      const v = values[c];
      if (v <= 0) return null;
      const top = y(base + v);
      const bottom = y(base);
      base += v;
      return (
        <rect
          key={c}
          x={x}
          y={top}
          width={barW}
          height={Math.max(1, bottom - top - 1)}
          rx={3}
          className={`bar bar--${kind} bar--${c}`}
        />
      );
    });
  };

  return (
    <figure className="chart">
      <div className="chart__legend" aria-hidden="true">
        <span className="legend-item">
          <span className="legend-swatch legend-swatch--income" />
          {he.dashboard.income}
        </span>
        <span className="legend-item">
          <span className="legend-swatch legend-swatch--expense" />
          {he.dashboard.expenses}
        </span>
        {preview
          ? CERTAINTIES.map((c) => (
              <span key={c} className="legend-item">
                <span className={`legend-swatch legend-swatch--${c}`} />
                {he.certainty[c]}
              </span>
            ))
          : null}
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="chart__svg"
        role="img"
        aria-label={t(he.dashboard.chartSummary, {
          details: months.map(monthSummary).join(". "),
        })}
      >
        <defs>
          <pattern
            id={`hatch-${hatchId}`}
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <rect width="6" height="6" className="hatch-bg" />
            <line x1="0" y1="0" x2="0" y2="6" className="hatch-line" />
          </pattern>
        </defs>
        {/* Forecast area after the today line (preview only). */}
        {preview && todayX !== null ? (
          <g>
            <rect
              x={todayX}
              y={PAD.top - 8}
              width={W - PAD.start - todayX}
              height={plotH + 8}
              className="chart-forecast-bg"
            />
            <text
              x={W - PAD.start - 6}
              y={PAD.top + 8}
              className="chart-caption"
              textAnchor="start"
              direction="rtl"
            >
              {he.dashboard.forecastCaption}
            </text>
          </g>
        ) : null}
        {/* Selected band */}
        {months.map((m, i) =>
          m.ym === selected ? (
            <rect
              key={m.ym}
              x={gx(i) + 4}
              y={PAD.top - 8}
              width={groupW - 8}
              height={plotH + 8 + 34}
              rx={6}
              className="chart-band"
            />
          ) : null,
        )}
        {/* Grid and Y axis labels on the right (inline-start in RTL) */}
        {[0, 1, 2, 3, 4].map((k) => (
          <g key={k}>
            <line
              x1={PAD.end}
              x2={W - PAD.start}
              y1={y(step * k)}
              y2={y(step * k)}
              className={k === 0 ? "chart-axis" : "chart-grid"}
            />
            <text
              x={W - PAD.start + 8}
              y={y(step * k) + 4}
              className="chart-tick"
              textAnchor="end"
              direction="rtl"
            >
              {formatCompactShekels(step * k, he.common.thousand)}
            </text>
          </g>
        ))}
        {months.map((m, i) => {
          const center = gx(i) + groupW / 2;
          const xIncome = center - gap / 2 - barW;
          const xExpense = center + gap / 2;
          const isSel = m.ym === selected;
          return (
            <g
              key={m.ym}
              className="chart-group"
              tabIndex={0}
              role="button"
              aria-pressed={isSel}
              aria-label={monthSummary(m)}
              onClick={() => onSelect(m.ym)}
              onKeyDown={(e) => onKey(e, i)}
              onMouseEnter={() => setHover(m.ym)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(m.ym)}
              onBlur={() => setHover(null)}
            >
              <title>{monthSummary(m)}</title>
              <rect
                x={gx(i)}
                y={PAD.top - 8}
                width={groupW}
                height={plotH + 50}
                className="chart-hit"
              />
              {m.future ? (
                <>
                  {stack(xIncome, m.future.income, "income")}
                  {stack(xExpense, m.future.expense, "expense")}
                </>
              ) : (
                <>
                  {m.income > 0 ? (
                    <rect
                      x={xIncome}
                      y={y(m.income)}
                      width={barW}
                      height={Math.max(1, y(0) - y(m.income))}
                      rx={3}
                      className="bar bar--income"
                    />
                  ) : null}
                  {m.expense > 0 ? (
                    <>
                      <rect
                        x={xExpense}
                        y={y(m.expense)}
                        width={barW}
                        height={Math.max(1, y(0) - y(m.expense))}
                        rx={3}
                        className="bar bar--expense"
                      />
                      <rect
                        x={xExpense}
                        y={y(m.expense)}
                        width={barW}
                        height={Math.max(1, y(0) - y(m.expense))}
                        rx={3}
                        fill={`url(#hatch-${hatchId})`}
                        className="bar-texture"
                      />
                    </>
                  ) : null}
                </>
              )}
              <text
                x={center}
                y={H - PAD.bottom + 20}
                textAnchor="middle"
                className={`chart-label ${isSel ? "is-selected" : ""}`}
                direction="rtl"
              >
                {formatMonthShort(m.ym)} {m.ym.slice(2, 4)}
              </text>
              {m.isCurrent ? (
                <text
                  x={center}
                  y={H - PAD.bottom + 36}
                  textAnchor="middle"
                  className="chart-caption"
                  direction="rtl"
                >
                  {he.dashboard.untilToday}
                </text>
              ) : null}
            </g>
          );
        })}
        {todayX !== null ? (
          <g className="chart-today" aria-hidden="true">
            <line x1={todayX} x2={todayX} y1={PAD.top - 6} y2={y(0)} />
            <text
              x={todayX}
              y={PAD.top - 14}
              textAnchor="middle"
              direction="rtl"
            >
              {t(he.dashboard.todayMarker, { date: formatDate(today) })}
            </text>
          </g>
        ) : null}
      </svg>
      {readout ? (
        <figcaption className="chart__readout" aria-hidden="true">
          {monthSummary(readout)}
        </figcaption>
      ) : null}
      <table className="sr-only">
        <caption>{he.dashboard.chartTableCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{he.dashboard.month}</th>
            <th scope="col">{he.dashboard.income}</th>
            <th scope="col">{he.dashboard.expenses}</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => (
            <tr key={m.ym}>
              <th scope="row">{formatMonth(m.ym)}</th>
              <td>
                {m.future
                  ? monthSummary(m)
                  : formatAmount(m.income, { decimals: 0, sign: "none" })}
              </td>
              <td>
                {m.future
                  ? ""
                  : formatAmount(m.expense, { decimals: 0, sign: "none" })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
