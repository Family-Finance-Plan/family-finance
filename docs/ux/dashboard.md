# Dashboard

## Purpose

The main screen (FR-80). In one view the family sees what happened this month and in recent months: income, expenses and balance, where the money went, and the transactions themselves. Layout follows the spec principle: a Timeline on top and a transaction table below with months that expand and collapse.

v0.1 is a past-data dashboard (D14) with the first chart being monthly income vs expense bars (D12). The forecast side of the Timeline (future items, certainty, editing future amounts) is phase 2; it is specified here as a **preview layer**, off by default, so the owner can judge the direction in the prototype (open question 1).

## FR IDs covered

v0.1:
- FR-80 Dashboard as the main screen
- FR-81 Timeline chart at the top (as monthly bars, D12)
- FR-82 past data with the present point marked (the forecast part is preview only)
- FR-84 grouped by months
- FR-85 months expand and collapse
- FR-86 transaction table below the chart
- FR-87 table shows date, description, amount, category and tags
- FR-60, D2 income / expense / transfer, transfers excluded from totals
- ADR-004 consequences: card charge as one row "חיוב אשראי לא מפורט"; every category view states its coverage; data completeness per month (spec-corrections C)
- FR-30, FR-31, NFR-11 quick edit of category and member from the table (shared drawer, see transactions.md)
- D7 totals in ILS by the charged amount

Preview layer only (phase 2, not v0.1 scope):
- FR-82 forecast part, FR-83 outlook ahead, FR-88 today marker row and coming events, FR-68 / R-009 certainty marking, FR-89, FR-90, FR-92 editing a future amount with "save" vs "temporary estimate"

## Layout

### Desktop (≥1024)

```
┌ AppShell ───────────────────────────────────────────────────────────────┐
│ PageHeader: "לוח בקרה"        MonthSelector [‹ אוקטובר 2026 ›]  [העלאה]│
│ CompletenessNote (only if the month is incomplete)                     │
├─────────────────────────────────────────────────────────────────────────┤
│ SummaryCards:  [הכנסות]   [הוצאות]   [מאזן החודש]                       │
├─────────────────────────────────────────────────────────────────────────┤
│ TimelineChart (inline size 2/3)          │ CategoryBreakdown (1/3)      │
│  bars per month, "היום" marker           │  top categories + coverage   │
│  [ ] הצגת תחזית (תצוגה מקדימה)            │                              │
├─────────────────────────────────────────────────────────────────────────┤
│ MonthlyTransactionTable                                                  │
│  ▾ אוקטובר 2026   הכנסות +… הוצאות −… (expanded)                        │
│     rows …                                                               │
│  ▸ ספטמבר 2026    …                                                     │
│  ▸ אוגוסט 2026    …                                                     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tablet (600–1023)

Summary cards in a row of 3; Timeline full width; CategoryBreakdown full width below it; table below.

### Phone (<600)

Single column, in this order: MonthSelector (sticky under TopBar), SummaryCards as a horizontal scroll-snap row (each card 80% width, order: income, expenses, balance), TimelineChart (height 200px), CategoryBreakdown (top 5 + "הצגת הכל"), then the table rendered as `TransactionCardList` (one card per transaction, see below). The "העלאה" button moves to the BottomNav only.

## Components

### `MonthSelector`

- Shows the selected month, "אוקטובר 2026". Previous / next buttons with `aria-label="החודש הקודם"` / `"החודש הבא"`. In RTL the "previous" arrow sits at inline-start (right) and points right; next sits at inline-end (left) and points left.
- Range: from the earliest month with data to the current month (`DEMO_TODAY`). Next is disabled on the current month (unless the preview layer is on, then up to 2 months ahead).
- Default: the current month. Selection drives the cards, the breakdown and which month is expanded in the table.

### `CompletenessNote` (spec-corrections C: data completeness per month)

Shown under the header when not all accounts have data for the whole selected month. Style: `--bg-subtle`, info icon.
- Copy: "נתוני {month} חלקיים: יש נתונים מ-{n} מתוך {total} חשבונות, עד {lastDate}." Example: "נתוני אוקטובר 2026 חלקיים: יש נתונים מ-2 מתוך 2 חשבונות, עד 15/10/2026." or "…מ-1 מתוך 2 חשבונות…".
- Action link: "העלאת דף חשבון" → `/upload`.

### `SummaryCards`

Three `SummaryCard`s for the selected month. Amounts with 0 decimals. Transfers are excluded (D2).

| Card | Label | Value | Sub-line |
|---|---|---|---|
| Income | "הכנסות" | sum of income, `--income`, "+" | "{n} תנועות" |
| Expenses | "הוצאות" | sum of expenses, `--expense`, "−" | "{n} תנועות" |
| Balance | "מאזן החודש" | income − expenses, `--income` if ≥ 0 else `--expense`, with sign | "לעומת {prevMonth}: {delta}" (delta with sign; omitted for the first month) |

A fourth, smaller line under the cards when transfers exist: "העברות ({n}) לא נכללות בסיכום" with a link that filters the table to transfers.

Each card is a `<section aria-labelledby>`; the value is not interactive.

### `TimelineChart`

- Grouped vertical bars per month: income (`--income`) and expense (`--expense`), side by side. Shows the last 6 months that have data (demo: Aug, Sep, Oct 2026).
- X axis: months, left to right in time order (see README principle 3). Y axis on the inline-start side (right), ILS with 0 decimals and compact notation ("‏10 אלף ₪").
- **Present point**: a vertical dashed line `--text` inside the current month's group at the position of `DEMO_TODAY` within the month, with the label "היום · 15/10/2026" above it. The current month's bars are drawn at 100% opacity for month-to-date data and carry a small caption "עד היום" under the axis label.
- Selected month: its axis label is bold and the group has a `--bg-subtle` band behind it. Clicking or pressing Enter on a month group selects it.
- Tooltip on hover/focus: "{month}: הכנסות {x}, הוצאות {y}, מאזן {z}".
- Legend at the top inline-start: "הכנסות", "הוצאות" (and in preview: "מאומת", "צפוי", "הערכה").
- Accessibility: the SVG has `role="img"` and an `aria-label` summary; a visually hidden `<table>` with the same numbers follows it. Month groups are focusable (`tabindex="0"`, arrow keys move between months).
- Library suggestion: Recharts `BarChart` with a `ReferenceLine` for today, or a small hand-written SVG. Either way it must render RTL text correctly.

### `ForecastPreviewToggle` (preview layer, off by default)

- Checkbox under the chart: "הצגת תחזית (תצוגה מקדימה)" with a chip "לא בגרסה 0.1".
- When on:
  - The chart adds the next 2 months (Nov, Dec 2026) after the current month; with the left-to-right time axis they appear to the right of the "היום" line. Future bars are built from future items only (demo-data.md) and drawn per certainty: verified = solid fill, expected = 50% fill with dashed outline, estimate = outline only with dotted border. The legend explains each with text.
  - The area after the "היום" line has a `--bg-subtle` background with the caption "תחזית – אינה התחייבות" (FR-111 tone: a forecast is not a promise).
  - The table shows future rows (below).
- Never mixes certainties into one number: the tooltip for a future month lists them separately: "מאומת {a} · צפוי {b} · הערכה {c}".

### `CategoryBreakdown`

- Title "לאן הלך הכסף – {month}".
- Horizontal bar list (not a donut, for readability and screen readers): one row per expense category, sorted by amount: category name at inline-start, bar, amount and percent of categorized expenses at inline-end. Top 6 shown, then "עוד {n} קטגוריות" expands.
- A separate last row, hatched `--not-itemized`: "חיוב אשראי לא מפורט" with its amount and the hint "פירוט הכרטיס יגיע בהמשך" (ADR-004).
- Toggle at the top: "הוצאות" / "הכנסות" (segmented control).
- **`CoverageNote`** (mandatory, ADR-004), directly under the title, `--text-muted`:
  - "מבוסס על {p}% מההוצאות · {n} מתוך {total} חשבונות" — e.g. "מבוסס על 63% מההוצאות · 2 מתוך 3 חשבונות". The percentage = categorized, itemized expenses ÷ all expenses in the month. Accounts count bank accounts with data for the month plus the card, which has no itemized data in v0.1.
  - Info button `aria-label="מה זה אומר?"` opens a popover: "חיובי כרטיס אשראי מופיעים בדף הבנק כשורה אחת ולכן לא מחולקים לקטגוריות. תנועות שעדיין לא סווגו גם הן לא נספרות."
- Clicking a category row filters the table below to that category for the selected month (a removable chip "סינון: {category}" appears above the table). It also offers "פתיחה בתנועות" → `/transactions?category=…&month=…`.

### `MonthlyTransactionTable`

- One `MonthGroup` per month, newest first. The selected month is expanded; the others are collapsed. Expanding is independent of selection (several can be open).
- `MonthGroup` header (a `<button aria-expanded>` spanning the row): chevron, "אוקטובר 2026", then "הכנסות +{x} · הוצאות −{y} · {n} תנועות", and for the current month the tag "חודש נוכחי".
- Columns (desktop):

| # | Header | Content | Width |
|---|---|---|---|
| 1 | "תאריך" | `DateCell` | 96px |
| 2 | "תיאור" | description; second line `--text-muted` with the account name, e.g. "חשבון עו״ש א" | flex |
| 3 | "קטגוריה" | category chip (click = quick edit) | 180px |
| 4 | "שיוך" | member and tag chips, max 2 visible + "+{n}" | 180px |
| 5 | "סוג" | `TypeBadge` (hidden < 1024, shown as colour/sign only) | 80px |
| 6 | "סכום" | `Amount`, 2 decimals, aligned to inline-end | 120px |

- Sorting inside a month: date descending. No column sorting on the dashboard (it is on the transactions screen).
- The card charge row shows the `--not-itemized` style, its category cell reads "חיוב אשראי לא מפורט" and is not editable.
- Row click / Enter opens `TransactionEditDrawer` (spec in transactions.md). Clicking the category or member chip opens the inline popover editor directly.
- Each expanded month shows at most 20 rows, then "הצגת כל {n} התנועות בחודש" → `/transactions?month=…`.

### Today row and future rows (preview layer only)

When the preview is on, the current month's group gets:
- A `TodayDivider` row after the last actual transaction: full-width line `--text` with the centred label "היום · 15/10/2026".
- Below it, future items for the rest of the month (FR-88), each row with a `CertaintyBadge` in the type column ("מאומת" / "צפוי" / "הערכה"), the amount in `--text-muted`, and the certainty border style on the row's inline-start edge (3px solid/dashed/dotted). Future months (Nov, Dec) appear as collapsed groups above October, labelled "נובמבר 2026 · תחזית".
- **Editing a future amount (FR-89, FR-90, FR-92):** the amount cell of a future row is an edit button ("עריכת סכום"). It opens `FutureAmountDialog`:
  - Title "שינוי סכום עתידי"; shows the item name and month, current value, certainty.
  - Field "סכום חדש" (₪, numeric, `inputmode="decimal"`, `dir="ltr"`).
  - Radio group, required, no default selected:
    - "שמירת השינוי" — hint "הערך החדש יחליף את הקודם מהחודש הזה והלאה. הערך הקודם נשמר בהיסטוריה." (R-010: never overwrite, keep the effective date and previous value)
    - "הערכה זמנית בלבד" — hint "רק לבדיקה. הערך המקורי לא משתנה, והשורה תסומן כהערכה."
  - Buttons "אישור" (disabled until a choice is made) and "ביטול".
  - After "save": toast "הסכום עודכן מ-{month}. הערך הקודם נשמר." After "temporary": the row shows the `הערכה` badge and a small "זמני" tag with a "ביטול ההערכה" link.
  - Prototype only: changes live in memory and reset on reload.

### `TransactionCardList` (phone)

Each month group is a collapsible section with the same header (sticky while scrolling inside it). Each transaction is a card: line 1 description (start) and amount (end); line 2 date · account (muted); line 3 category chip and member chips. Tap opens `TransactionEditDrawer` as a bottom sheet.

## Interactions summary

| Action | Result |
|---|---|
| Change month (selector or chart) | Cards, breakdown, completeness note update; that month expands in the table and scrolls into view only if the user used the chart |
| Click category in breakdown | Filter chip on the table |
| Expand / collapse month | Toggles that group; state kept in the URL hash (`#open=2026-09,2026-10`) so back/forward works |
| Click a transaction | Edit drawer (category and member in the same window) |
| Toggle forecast preview | Adds future months to the chart and future rows to the table |
| Edit future amount (preview) | Dialog with "save" vs "temporary estimate" |

## States

| State | Cards | Chart | Breakdown | Table |
|---|---|---|---|---|
| Loading | 3 skeleton cards | grey bar skeleton | 5 skeleton rows | 2 collapsed skeleton month headers + 6 skeleton rows |
| Empty (no approved transactions yet) | Hidden. Instead one `EmptyState`: title "עוד אין נתונים", text "מעלים דף חשבון בנק, בודקים את התנועות ומאשרים. הלוח יתמלא מיד אחרי האישור.", primary "העלאת דף חשבון" → `/upload`. If documents are waiting for review: secondary "{n} מסמכים מחכים לבדיקה" → review | hidden | hidden | hidden |
| Selected month has no data | Cards show "—" with "אין נתונים לחודש זה" | other months still shown | "אין הוצאות בחודש זה" | the month group says "אין תנועות בחודש זה" |
| Only uncategorized data | normal | normal | Breakdown shows "טרם סווג" as the only row and the coverage note says "מבוסס על 0% מההוצאות" with a link "סיווג תנועות" → `/transactions?category=none` | normal |
| Error | `ErrorState` in place of the whole content: "לא הצלחנו לטעון את לוח הבקרה." + "נסו שוב". If only one part fails, that part shows its own small error with retry and the rest stays | | | |
| Limited role | Same view; rows open the drawer read-only; no edit chips; no future amount edit | | | |

Prototype: a hidden dev menu (`?state=loading|empty|error`) forces each state for review.

## RTL notes

- Page header: title at inline-start (right), month selector and upload button at inline-end (left).
- Chart: time runs left to right; the Y axis is on the right (inline-start); legend at the top right. Tooltip text RTL. Compact Y labels wrapped in `<bdi>`.
- Breakdown bars grow from inline-start (right) to the left: use `margin-inline-end: auto` / a flex row so it flips automatically, not `transform`.
- Table: date is the first column (rightmost), amount last (leftmost), amounts aligned to inline-end.
- Chevron on month headers: a down chevron when expanded, a chevron pointing to inline-end (left in RTL) when collapsed. Use one icon and mirror it with the RTL icon rule.
- Future-row certainty edge uses `border-inline-start`.

## Development notes

- Components: `DashboardPage`, `PageHeader`, `MonthSelector`, `CompletenessNote`, `SummaryCards`/`SummaryCard`, `TimelineChart`, `ForecastPreviewToggle`, `CategoryBreakdown`, `CoverageNote`, `MonthlyTransactionTable`, `MonthGroup`, `TransactionRow`, `TransactionCardList`, `TodayDivider`, `FutureRow`, `FutureAmountDialog`, `TransactionEditDrawer` (shared).
- Derive all numbers from the demo transactions in one selector module (`dashboardSelectors.ts`): `monthTotals(month)`, `categoryBreakdown(month, type)`, `coverage(month)`, `completeness(month)`. Integer agorot sums only. Transfers excluded from income/expense totals. Unapproved review rows are never counted (R-008).
- Coverage formula (prototype): `itemizedCategorized / allExpenses` where card charges and rows with no category are not "itemized categorized". Round down to a whole percent so it never overstates.
- The preview layer is behind a feature flag `previewForecast` (default false) so it can be removed cleanly. Future items are a separate collection with a required `certainty: 'verified' | 'expected' | 'estimate'` field (R-009); the type does not allow a missing certainty.
- Keep the Y axis = monthly income and expense totals in v0.1. A balance line is later (D12).

## Left out of v0.1

- Forecast, future events, "save vs temporary estimate" as real features (phase 2; preview only).
- Balance line and liquid balance (D12, FR-91, FR-102).
- Investment and net worth layers (phase 3).
- Daily granularity inside a month on the chart (FR-83's "rises and falls during the month"): later, with the balance line.
- Budget vs actual (phase 4).
