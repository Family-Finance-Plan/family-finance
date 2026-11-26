/**
 * All display formatting (docs/ux/README.md "Formatting").
 * Amounts are integer agorot and are never divided into a float: the decimal string is built
 * with integer operations and Intl formats that string exactly.
 */
import type { IsoDate, IsoDateTime } from "../demo/types";

const MINUS = "−";

export interface AmountOptions {
  decimals?: 0 | 2;
  /** 'auto': "+" / "−" for non-zero values; 'none': no sign at all (absolute value). */
  sign?: "auto" | "none";
}

/** Exact decimal string of an agorot amount, e.g. -123456 → "-1234.56". */
export function agorotToDecimalString(agorot: number): string {
  if (!Number.isSafeInteger(agorot)) {
    throw new TypeError("Amount must be an integer number of agorot");
  }
  const abs = Math.abs(agorot);
  const sign = agorot < 0 ? "-" : "";
  return `${sign}${Math.trunc(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

const formatters = new Map<string, Intl.NumberFormat>();
function numberFormat(
  key: string,
  options: Intl.NumberFormatOptions,
): Intl.NumberFormat {
  let f = formatters.get(key);
  if (!f) {
    f = new Intl.NumberFormat("he-IL", options);
    formatters.set(key, f);
  }
  return f;
}

/** Formats integer agorot as ILS, e.g. 123456 → "‏1,234.56 ₪"; decimals 0 → "‏1,235 ₪". */
export function formatAmount(agorot: number, opts: AmountOptions = {}): string {
  const decimals = opts.decimals ?? 2;
  const sign = opts.sign ?? "auto";
  const value = agorotToDecimalString(
    sign === "none" ? Math.abs(agorot) : agorot,
  );
  const f = numberFormat(`ils-${decimals}-${sign}`, {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: sign === "none" ? "never" : "exceptZero",
  });
  return f.format(value as Intl.StringNumericLiteral).replace("-", MINUS);
}

/** Formats an amount in its original minor units (D7), e.g. USD 12000 → "‏120.00 $". */
export function formatOriginal(currency: string, amountMinor: number): string {
  const f = numberFormat(`orig-${currency}`, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return f.format(
    agorotToDecimalString(amountMinor) as Intl.StringNumericLiteral,
  );
}

/**
 * Compact amount for chart axes, whole thousands only: 1000000 agorot → "10 אלף ₪".
 * `thousandWord` comes from the locale file.
 */
export function formatCompactShekels(
  agorot: number,
  thousandWord: string,
): string {
  const shekels = Math.trunc(agorot / 100);
  if (Math.abs(shekels) < 1000)
    return formatAmount(agorot, { decimals: 0, sign: "none" });
  const thousands = Math.trunc(shekels / 1000);
  return `${numberFormat("int", { maximumFractionDigits: 0 }).format(thousands)} ${thousandWord} ₪`;
}

/**
 * Parses a user-typed shekel amount ("1,234.5", "1234") into integer agorot without floats.
 * Returns null when the input is not a valid non-negative amount with at most 2 decimals.
 */
export function parseAmountInput(input: string): number | null {
  const cleaned = input.replace(/[\s,₪‎‏]/g, "");
  const m = /^(\d{1,9})(?:\.(\d{0,2}))?$/.exec(cleaned);
  if (!m) return null;
  const whole = Number(m[1]);
  const frac = Number((m[2] ?? "").padEnd(2, "0"));
  return whole * 100 + frac;
}

/** Plain decimal text for an amount input field, e.g. 4800 → "48.00". */
export function amountToInput(agorot: number): string {
  return agorotToDecimalString(agorot);
}

/** '2026-10-03' → '03/10/2026' by string slicing (no Date, no time-zone shifts). */
export function formatDate(iso: IsoDate): string {
  return `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
}

/** '2026-10-15T09:12' → '15/10/2026 09:12'. */
export function formatDateTime(iso: IsoDateTime): string {
  return `${formatDate(iso.slice(0, 10))} ${iso.slice(11, 16)}`;
}

const monthLong = new Intl.DateTimeFormat("he-IL", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const monthShort = new Intl.DateTimeFormat("he-IL", {
  month: "short",
  timeZone: "UTC",
});
const monthOnly = new Intl.DateTimeFormat("he-IL", {
  month: "long",
  timeZone: "UTC",
});

function monthUtc(ym: string): number {
  return Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)) - 1, 1);
}

/** '2026-10' → 'אוקטובר 2026'. */
export function formatMonth(ym: string): string {
  return monthLong.format(monthUtc(ym));
}

/** '2026-10' → 'אוק׳'. */
export function formatMonthShort(ym: string): string {
  return monthShort.format(monthUtc(ym));
}

/** '2026-10' → 'אוקטובר'. */
export function formatMonthName(ym: string): string {
  return monthOnly.format(monthUtc(ym));
}

/** 'YYYY-MM' shifted by `delta` months, using integer arithmetic. */
export function addMonths(ym: string, delta: number): string {
  const index =
    Number(ym.slice(0, 4)) * 12 + Number(ym.slice(5, 7)) - 1 + delta;
  const y = Math.floor(index / 12);
  const m = (index % 12) + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function monthOf(iso: IsoDate): string {
  return iso.slice(0, 7);
}

/** Number of days in a 'YYYY-MM' month. */
export function daysInMonth(ym: string): number {
  return new Date(
    Date.UTC(Number(ym.slice(0, 4)), Number(ym.slice(5, 7)), 0),
  ).getUTCDate();
}

/** Formats a byte size for the upload queue: "182 KB" / "2.4 MB". */
export function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  const tenths = Math.round((bytes * 10) / (1024 * 1024));
  return `${Math.trunc(tenths / 10)}.${tenths % 10} MB`;
}

/** Fills `{name}` placeholders in a locale template. */
export function t(
  template: string,
  values: Record<string, string | number> = {},
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in values ? String(values[key]) : `{${key}}`,
  );
}

/** Case- and niqqud-insensitive normalisation for search (transactions.md). */
export function normalizeSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[֑-ׇ]/g, "")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

/** Avatar initials from a display name: "הורה א" → "הא". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("");
}
