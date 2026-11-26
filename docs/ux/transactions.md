# Transactions

## Purpose

One place for all approved transactions from all documents (FR-27). The user finds transactions fast with filters and fixes category and household-member assignment in the same window (NFR-11, decision "Editing a transaction" in spec section 10).

## FR IDs covered

- FR-27 central screen of all transactions
- FR-28 list shows date, description, amount, type, category, tags/assignment (one-off marker: left out, see below)
- FR-29 edit fields directly from the list (drawer + inline chips)
- FR-30 change category; FR-31 change tags/assignment; FR-46 quick, email-label-like editing
- FR-33 + D11 delete with undo (recoverable)
- FR-34 select several and bulk edit (category, assignment, delete)
- FR-35 filter by period; FR-36 by member/tag; FR-37 by category; FR-38 by type; FR-40 by merchant (search)
- FR-41 several members per transaction; FR-42 "משפחה" tag; FR-43 one category + several tags; FR-45 personal tags (goals part left out)
- FR-59 categories and subcategories; D8 default list
- D2 transfer type, marked by hand, excluded from totals
- D7 original currency shown
- ADR-004 card charge row "חיוב אשראי לא מפורט"; CoverageNote on the month totals when a category filter is active

## Layout

### Desktop (≥1024)

```
PageHeader: "תנועות"                                                    [העלאה]
FilterBar:  [חיפוש תיאור או בית עסק……]  [תקופה ▾] [קטגוריה ▾] [שיוך ▾] [חשבון ▾] [תגיות ▾] [סוג ▾]  [ניקוי]
ActiveFilterChips + ResultSummary: "{n} תנועות · הכנסות +{x} · הוצאות −{y}"
CoverageNote (only when a category filter is active)
TransactionList
  ▾ אוקטובר 2026   הכנסות +… · הוצאות −… · {n} תנועות
     [☐] 03/10/2026  סופר שכונתי          [מזון וקניות ›סופרמרקט] [משפחה]  הוצאה  −412.30 ₪
     …
  ▸ ספטמבר 2026 …
BulkActionBar (appears when ≥1 selected, sticky bottom)
```
The edit drawer (`TransactionEditDrawer`) opens from the inline-end side (left in RTL), 420px wide, over the list without hiding the filters.

### Tablet (600–1023)

FilterBar shows search + "תקופה" + a "סינון" button that opens the other filters in a popover; the drawer is 380px.

### Phone (<600)

- Sticky search field under the TopBar, with a "סינון" button showing the active filter count badge. Filters open in a full-height bottom sheet `FilterSheet` with "הצגת {n} תוצאות" and "ניקוי".
- The list becomes `TransactionCardList` (same as Dashboard phone). Long-press or the overflow button on a card enters selection mode.
- The drawer becomes a bottom sheet (90% height).

## Components

### `FilterBar`

All filters are reflected in the URL query (`?q=&from=&to=&category=&member=&account=&tag=&type=`) so views can be shared inside the household and back/forward works. Each is a labelled control.

| Filter | Label | Control | Options |
|---|---|---|---|
| Search (FR-40) | "חיפוש" (placeholder "חיפוש תיאור או בית עסק") | text input, 250ms debounce, clear button | matches description, case- and niqqud-insensitive |
| Period (FR-35) | "תקופה" | popover: presets "החודש", "החודש הקודם", "3 חודשים אחרונים", "השנה", "הכל" + "טווח מותאם" with two date inputs "מתאריך" / "עד תאריך" | default "3 חודשים אחרונים" |
| Category (FR-37) | "קטגוריה" | multi-select tree (parent selects all children), search inside, plus "טרם סווג" | from the category list in demo-data.md |
| Member (FR-36) | "שיוך" | multi-select: members + "משפחה" + "ללא שיוך" | |
| Account | "חשבון" | multi-select: "חשבון עו״ש א", "חשבון עו״ש ב", "כרטיס אשראי (חיובים)" | |
| Tags (FR-45) | "תגיות" | multi-select of personal tags | e.g. "חופשה", "שיפוץ" |
| Type (FR-38) | "סוג" | segmented: "הכל" / "הכנסות" / "הוצאות" / "העברות" | |

- "ניקוי" resets all to defaults. Active filters show as removable chips: "קטגוריה: מזון וקניות ✕" (the ✕ button has `aria-label="הסרת הסינון קטגוריה: מזון וקניות"`).
- `ResultSummary` updates live (`aria-live="polite"`). Transfers are excluded from the sums and counted separately: "· {t} העברות".

### `TransactionList`

- Grouped by month, newest first. All months in the filtered range are expanded by default when the result has ≤ 100 rows; otherwise only the newest month is expanded.
- `MonthGroup` header as on the Dashboard (button, `aria-expanded`), plus a header checkbox "בחירת כל התנועות בחודש".
- Columns (desktop):

| # | Header | Content | Interaction |
|---|---|---|---|
| 1 | checkbox | select | Space |
| 2 | "תאריך" | `DateCell` | sortable |
| 3 | "תיאור" | description; muted second line: account name, and for foreign currency the original amount | sortable |
| 4 | "קטגוריה" | chip "{parent} › {sub}" or a dashed chip "טרם סווג" | click → `CategoryPicker` popover |
| 5 | "שיוך ותגיות" | member chips + tag chips (tags in outline style), up to 3 then "+{n}"; empty shows a dashed "+ שיוך" | click → `MemberTagPicker` popover |
| 6 | "סוג" | `TypeBadge` | |
| 7 | "סכום" | `Amount` 2 decimals, inline-end aligned | sortable |
| 8 | overflow "⋯" | menu: "עריכה", "מחיקה" | |

- Sort: default date descending within each month; sorting by amount or description sorts within months (groups stay).
- Row click (outside chips) or Enter → `TransactionEditDrawer`.
- Card charge rows: `--not-itemized` style, category cell "חיוב אשראי לא מפורט" not editable; assignment still editable.
- Virtualize per month group if a month has more than 200 rows.

### Quick edit popovers (FR-30, FR-31, FR-46)

The "label in email" pattern: click the chip, a popover opens anchored to it with a search field focused.

- `CategoryPicker`: search, recent 5 categories at the top ("אחרונות"), then the tree. Choosing saves immediately, closes the popover and shows toast "הקטגוריה עודכנה" with "ביטול" (undo). Only categories of the row's type are listed (income categories for income); transfers have no category ("העברה" fixed).
- `MemberTagPicker`: two sections, "בני משפחה" (checkboxes for each member and "משפחה") and "תגיות" (checkboxes + "יצירת תגית '{text}'" when the search has no match). Changes save when the popover closes (Esc or click outside); toast "השיוך עודכן" + undo. Choosing "משפחה" does not clear individual members; both can exist (FR-41, FR-42).

### `TransactionEditDrawer`

Shared with the Dashboard. One window for everything, category and assignment at the top because they are the most common edits.

| Order | Field | Label | Notes |
|---|---|---|---|
| 1 | Category | "קטגוריה" | `CategoryPicker` inline (not a popover) |
| 2 | Members | "שיוך לבני משפחה" | chips toggle: each member + "משפחה" |
| 3 | Tags | "תגיות" | `MemberTagPicker` tag section |
| 4 | Type | "סוג" | radio "הכנסה" / "הוצאה" / "העברה"; hint for transfer: "העברות לא נכללות בסיכומי הכנסות והוצאות" |
| 5 | Description | "תיאור" | text |
| 6 | Date | "תאריך" | date input |
| 7 | Amount | "סכום (₪)" | `dir="ltr"`, decimal; original currency read-only below if any |
| — | Source (read-only) | "מקור" | "חשבון עו״ש א · {file name} · הועלה {date}" with link to the upload history |
| — | History (read-only, collapsed) | "היסטוריית שינויים" | list "{date} · {who} · {field}: {old} → {new}" |

- Footer: "שמירה" (primary, inline-end) and "ביטול"; "מחיקה" as a danger text button at inline-start.
- Unsaved changes + Esc/close: inline confirm "לבטל את השינויים?" "ביטול שינויים" / "המשך עריכה".
- Save → drawer closes, toast "התנועה נשמרה", row briefly highlighted (`--bg-subtle`, 1s, skipped under reduced motion).
- Limited role: all fields read-only, footer shows only "סגירה".

### Delete with undo (FR-33, D11)

- "מחיקה" asks no confirmation dialog (it is recoverable): the row disappears, toast "התנועה נמחקה" with "ביטול" for 10 seconds. Bulk delete of more than 1 row does confirm: "למחוק {n} תנועות? אפשר לשחזר מיד אחרי המחיקה."
- Deleted rows are hidden, not removed. The prototype keeps them with `deletedAt`. A "הצגת תנועות שנמחקו" toggle at the bottom of the filters lists them with "שחזור" (restore). Totals never include deleted rows.

### `BulkActionBar` (FR-34)

Sticky at the bottom when ≥ 1 row is selected: "{n} נבחרו" · "שינוי קטגוריה" · "שיוך" · "סימון כהעברה" · "מחיקה" · "ביטול בחירה". Category change applies only to rows whose type fits; if mixed, the bar says "{k} תנועות מסוג אחר לא ישתנו". Result toast with undo.

## States

| State | What shows |
|---|---|
| Loading | FilterBar enabled, 2 skeleton month headers, 10 skeleton rows |
| Empty household (no transactions at all) | `EmptyState`: "עוד אין תנועות", "תנועות מופיעות כאן אחרי שמעלים מסמך ומאשרים אותו.", primary "העלאת דף חשבון" |
| No results for filters | "לא נמצאו תנועות שמתאימות לסינון." + "ניקוי הסינון" |
| Error | `ErrorState` "לא הצלחנו לטעון את התנועות." + retry. A failed quick edit reverts the chip and shows toast "השינוי לא נשמר. נסו שוב." (`--danger`) |
| Saving | Drawer save button "שומר…", disabled |
| After intake (`?document=`) | Info banner "מציג {n} תנועות שנקלטו מ-{file}" with "הצגת כל התנועות" |
| Limited role | No checkboxes, no chips as buttons, no overflow menu; drawer read-only |

## Keyboard

- `/` focuses search. In the list: ↑/↓ move between rows, Enter opens the drawer, `C` opens the category picker, `M` opens the member picker, Space selects, `Delete` deletes (with undo). Shortcuts listed in a "קיצורי מקלדת" popover in the page header.
- Popovers: focus starts in their search field, Esc closes and returns focus to the chip.

## RTL notes

- Drawer slides in from inline-end (left in RTL): `inset-inline-end: 0`, animation via `translate` on the inline axis using a direction-aware value (`[dir=rtl]` uses `translateX(-100%)` → 0).
- Category chip "{parent} › {sub}": use the mirrored chevron "‹" in RTL, or render the separator as a direction-neutral "·". Recommendation: "מזון וקניות · סופרמרקט".
- Filter popovers align to the inline-start edge of their trigger.
- Search placeholder and typed Hebrew are RTL; merchant names in Latin letters inside rows use `<bdi>`.

## Development notes

- Components: `TransactionsPage`, `FilterBar`, `FilterSheet`, `PeriodFilter`, `ActiveFilterChips`, `ResultSummary`, `TransactionList`, `MonthGroup` (shared), `TransactionRow` (shared), `TransactionCardList` (shared), `CategoryPicker` (shared), `MemberTagPicker` (shared), `TransactionEditDrawer` (shared), `BulkActionBar`, `UndoToast`.
- One filter function over the in-memory demo collection; keep it pure and tested (`filterTransactions(transactions, filters)`), so the real API can replace it with the same filter object.
- Edits never overwrite silently: keep a `history` array on the transaction (field, old, new, who, at) in the prototype, which the drawer shows.
- Totals: integer agorot sums; exclude `type === 'transfer'` and `deletedAt`.

## Left out of v0.1

- One-off marker column and action (FR-19, FR-28 part, FR-32, FR-47 to FR-49): phase 2. The list leaves room for a column after "סוג".
- Notes (FR-44) and family goals (FR-45 part): not in D14.
- Amount range filter (FR-39): later.
- "Apply to similar transactions" prompts (FR-51 to FR-58): phase 2.
- Creating or renaming categories (FR-64): no management screen in v0.1.
- Export (open topic in spec-corrections D).
