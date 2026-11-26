/** Shared display primitives (docs/ux/README.md "Shared components"). */
import type { ReactNode } from "react";
import type { Certainty, IsoDate, OriginalAmount, TxType } from "../demo/types";
import { formatAmount, formatDate, formatOriginal, t } from "../lib/format";
import { he } from "../locale/he";
import { Icon, type IconName } from "./Icon";

/** Renders an amount by type: "+" income, "−" expense, no sign for transfers (sign is presentation only). */
export function Amount({
  agorot,
  type,
  decimals = 2,
  muted = false,
  original,
}: {
  agorot: number;
  /** Omit to show a signed value as given (balances). */
  type?: TxType | "balance";
  decimals?: 0 | 2;
  muted?: boolean;
  original?: OriginalAmount;
}) {
  let value = agorot;
  let tone = "amount--neutral";
  let sign: "auto" | "none" = "auto";
  if (type === "income") {
    value = Math.abs(agorot);
    tone = "amount--income";
  } else if (type === "expense") {
    value = -Math.abs(agorot);
    tone = "amount--expense";
  } else if (type === "transfer") {
    sign = "none";
    tone = "amount--transfer";
  } else if (type === "balance") {
    tone = agorot >= 0 ? "amount--income" : "amount--expense";
  } else {
    sign = "none";
  }
  return (
    <span className="amount-wrap">
      <bdi className={`amount ${muted ? "amount--muted" : tone}`}>
        {formatAmount(value, { decimals, sign })}
      </bdi>
      {original ? (
        <span className="amount-original">
          {t(he.table.original, {
            amount: formatOriginal(original.currency, original.amountMinor),
          })}
        </span>
      ) : null}
    </span>
  );
}

export function DateCell({ date }: { date: IsoDate }) {
  return <bdi className="date">{formatDate(date)}</bdi>;
}

const typeIcon: Record<TxType, IconName | null> = {
  income: null,
  expense: null,
  transfer: "transfer",
};

export function TypeBadge({ type }: { type: TxType }) {
  const icon = typeIcon[type];
  return (
    <span className={`badge badge--${type}`}>
      {type === "income" ? <span aria-hidden="true">+</span> : null}
      {type === "expense" ? <span aria-hidden="true">−</span> : null}
      {icon ? <Icon name={icon} size={14} /> : null}
      {he.types[type]}
    </span>
  );
}

const certaintyIcon: Record<Certainty, IconName> = {
  verified: "check",
  expected: "clock",
  estimate: "tilde",
};

/** Verified / expected / estimate: icon + text + colour + border style (R-009). */
export function CertaintyBadge({ certainty }: { certainty: Certainty }) {
  return (
    <span className={`badge badge--${certainty}`}>
      <Icon name={certaintyIcon[certainty]} size={14} />
      {he.certainty[certainty]}
    </span>
  );
}

export function NotItemizedBadge() {
  return (
    <span className="badge badge--not-itemized">
      <Icon name="card" size={14} />
      {he.status.notItemized}
    </span>
  );
}

/** Low-confidence highlight on a field: tint + icon + tooltip text (never a number). */
export function ConfidenceMark({
  active,
  children,
  onConfirm,
  confirmLabel,
}: {
  active: boolean;
  children: ReactNode;
  onConfirm?: () => void;
  confirmLabel?: string;
}) {
  if (!active) return <>{children}</>;
  return (
    <span className="confidence" title={he.status.lowConfidence}>
      <span className="confidence__value">{children}</span>
      <Icon
        name="warning"
        size={16}
        className="confidence__icon"
        label={he.status.lowConfidence}
      />
      {onConfirm ? (
        <button
          type="button"
          className="icon-btn icon-btn--xs"
          onClick={onConfirm}
          aria-label={confirmLabel ?? he.review.confirmValue}
          title={he.review.confirmValue}
        >
          <Icon name="check" size={14} />
        </button>
      ) : null}
    </span>
  );
}

export function Chip({
  children,
  color,
  variant = "solid",
}: {
  children: ReactNode;
  color?: string;
  variant?: "solid" | "outline" | "dashed";
}) {
  return (
    <span className={`chip chip--${variant}`}>
      {color ? (
        <span
          className="chip__dot"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      ) : null}
      {children}
    </span>
  );
}

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}
