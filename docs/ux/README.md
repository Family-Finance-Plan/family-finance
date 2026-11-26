# UX specs: v0.1 clickable prototype

Stage 3 output for Issue #8 (UX1). These files describe the screens the developer builds as a clickable React prototype (`apps/prototype`) running on demo data only (R-006, R-029). English text; Hebrew appears only as proposed UI copy, in quotes, and must live in `apps/prototype/src/locale/he.ts` (R-026), never in components.

## Index

| File | Screen | Route |
|---|---|---|
| [sign-in.md](sign-in.md) | Sign in with Google (mock) and first-run household setup | `/sign-in`, `/setup` |
| [dashboard.md](dashboard.md) | Main Dashboard: summary cards, Timeline, category breakdown, monthly transaction table | `/` |
| [upload-and-review.md](upload-and-review.md) | Upload documents, processing, review before intake, upload history | `/upload`, `/upload/:documentId/review` |
| [transactions.md](transactions.md) | All transactions, grouped by month, filters, quick edit | `/transactions` |
| [household.md](household.md) | Household members, users and roles, invite (mock) | `/household` |
| [demo-data.md](demo-data.md) | The synthetic household and data the prototype runs on | n/a |

## Scope

v0.1 = MVP phase 1 (spec-corrections D14): tenancy, Google login, household, document intake (upload, extraction, review, approval), transactions with categories and tags, basic past-data dashboard. Everything in scope is Must (D17), so the specs carry no priority labels.

Deliberately left out of v0.1 (each screen file repeats what applies to it):

| Left out | FR IDs | Why |
|---|---|---|
| One-off marking | FR-19, FR-32, FR-47 to FR-50 | Process phase 2, not in D14 |
| Learning from corrections, "apply to similar" prompts | FR-51 to FR-58, FR-65 | Phase 2; D13 says no learning in v0.1 |
| Future events, forecast, editing future amounts | FR-66 to FR-79, FR-82 (forecast part), FR-88 to FR-92 | Phase 2. Shown only as a clearly marked preview layer on the Dashboard, off by default (see dashboard.md, open question 1) |
| Notes, family goals | FR-44, FR-45 (goals part) | Not in D14 |
| Amount filter | FR-39 | Not requested for v0.1; search covers most needs. Cheap to add later |
| Category and subcategory management screen | FR-64 | D8: the default list is editable, but a management screen is not in D14. Categories are picked from the default list only |
| Assets, liabilities, net worth, investments | FR-93 to FR-103 | Phase 3 |
| Scenarios, What-If, budget | FR-104 to FR-115 | Phase 4 |
| Itemized credit card data (Card Insights) | ADR-004 | Phase 4. In v0.1 a card charge is one bank row with status "credit charge not itemized" |
| Dark theme, English UI | NFR-12 | Not needed for the prototype |

## Design principles

1. **RTL first (R-012).** `<html lang="he" dir="rtl">`. Layout uses CSS logical properties only: `margin-inline-start`, `padding-inline-end`, `inset-inline-start`, `border-inline-start`, `text-align: start`. No `left`/`right` in CSS. Directional icons (chevrons, arrows, "back") are mirrored with `transform: scaleX(-1)` under `[dir="rtl"]` or taken from a set that has RTL variants.
2. **Numbers, dates and times are isolated.** Wrap every amount, date, account suffix and file name in `<bdi>` (or `unicode-bidi: isolate`) so mixed text renders correctly. Use `font-variant-numeric: tabular-nums` in tables and cards.
3. **Charts keep time flowing left to right**, as in Israeli banking apps, while legends, titles and axis labels follow RTL. The Y axis sits on the inline-start (right) side. Decision noted in dashboard.md; reversible.
4. **Mobile-first.** Base styles target phones; enhance with `min-width` queries:
   - `sm` phone: < 600px (base)
   - `md` tablet: ≥ 600px
   - `lg` desktop: ≥ 1024px
   - `xl` wide: ≥ 1440px (content max width 1280px, centered)
5. **Accessibility (NFR-12 baseline, WCAG 2.1 AA where practical).**
   - Text contrast ≥ 4.5:1, large text and UI component borders ≥ 3:1. Every token below was chosen to meet this on its intended background.
   - Colour is never the only signal: income/expense also use a sign and a label, certainty and confidence also use an icon and text.
   - Full keyboard navigation: logical tab order (follows DOM order, which follows RTL reading order), visible focus ring (`--focus-ring`), `Esc` closes dialogs and drawers, focus is trapped in modals and returned to the trigger on close.
   - Every input has a visible `<label>`; icon-only buttons have `aria-label`. Tables use `<th scope>`; expandable month rows use `aria-expanded`. Status changes (upload done, saved, undo) are announced with an `aria-live="polite"` region.
   - Hit targets ≥ 44×44px on touch.
   - Respect `prefers-reduced-motion`.
6. **Every screen has loading, empty and error states.** Loading uses skeletons, not spinners, for tables and cards. Errors say what happened in plain Hebrew and offer one action.
7. **Nothing extracted enters without approval** (R-008, FR-13, FR-14). The UI never shows an "auto-approve" option.

## Visual language

### Colour tokens (light theme)

Defined as CSS custom properties on `:root` in `apps/prototype/src/styles.css`.

| Token | Value | Use | Contrast on `--bg-surface` |
|---|---|---|---|
| `--bg-page` | `#F5F6F8` | Page background | n/a |
| `--bg-surface` | `#FFFFFF` | Cards, tables, dialogs | n/a |
| `--bg-subtle` | `#EEF0F4` | Table header, hover row, month header | n/a |
| `--border` | `#C9CED6` | Dividers, input borders (use `--border-strong` for inputs) | n/a |
| `--border-strong` | `#8A93A3` | Input borders, focus-independent outlines | 3.1:1 |
| `--text` | `#1A1D23` | Body text | 16.9:1 |
| `--text-muted` | `#5B6472` | Secondary text, captions | 6.0:1 |
| `--primary` | `#2952CC` | Primary buttons, links, active nav | 6.6:1 |
| `--primary-contrast` | `#FFFFFF` | Text on `--primary` | 6.6:1 |
| `--focus-ring` | `#2952CC` | 2px outline, 2px offset | n/a |
| `--danger` | `#B42318` | Errors, destructive actions | 6.6:1 |
| `--banner-bg` / `--banner-text` | `#3D2E00` / `#FFE58A` | Prototype banner | 10.6:1 |

Semantic set:

| Token | Text / icon | Background (badge, row tint) | Meaning | Paired non-colour cue |
|---|---|---|---|---|
| `--income` | `#1B7F3B` | `#E6F4EA` | Income | "+" sign, label "הכנסה" |
| `--expense` | `#B42318` | `#FDECEA` | Expense | "−" sign, label "הוצאה" |
| `--transfer` | `#5B6472` | `#EEF0F4` | Transfer (excluded from totals, D2) | ⇄ icon, label "העברה" |
| `--verified` | `#0F6E6E` | `#E0F2F1` | Future item: verified | solid border, check icon, "מאומת" |
| `--expected` | `#8A5300` | `#FFF1DB` | Future item: expected | dashed border, clock icon, "צפוי" |
| `--estimate` | `#6B3FA0` | `#F1EAFB` | Future item: estimate | dotted border, "~" icon, "הערכה" |
| `--low-confidence` | `#6B4E00` | `#FFF4CC` | Extracted field the system is unsure of | warning triangle icon, tooltip "ביטחון נמוך – כדאי לבדוק" |
| `--unparsed` | `#B42318` | `#FDECEA` | Row the system could not parse | error icon, label "לא פוענח" |
| `--not-itemized` | `#5B6472` | `#EEF0F4` with diagonal hatch | Credit card charge not itemized (ADR-004) | card icon, label "חיוב אשראי לא מפורט" |

Chart colours: income bars `--income`, expense bars `--expense`; category breakdown uses an 8-step categorical palette (`--cat-1` … `--cat-8`: `#2952CC #1B7F3B #B42318 #8A5300 #6B3FA0 #0F6E6E #9C2A6B #4A5568`) plus `--not-itemized` with hatch for the non-itemized slice. Every slice is also labelled in text in the legend.

### Typography

- Family: **Rubik** from Google Fonts (weights 400, 500, 700; subsets `hebrew,latin`), with fallback `"Rubik", "Segoe UI", "Arial Hebrew", Arial, system-ui, sans-serif`. Load with `display=swap`. (Alternative if the owner prefers a lighter look: Assistant.)
- Scale (rem, base 16px): `--fs-xs 0.75` (captions), `--fs-sm 0.875` (table cells, labels), `--fs-md 1` (body), `--fs-lg 1.25` (section titles), `--fs-xl 1.5` (page titles), `--fs-2xl 2` (summary card amounts).
- Line height 1.5 for text, 1.2 for numbers in cards. Numbers: `tabular-nums`.

### Spacing, radius, elevation

- Spacing scale (4px base): `--sp-1 4px`, `--sp-2 8px`, `--sp-3 12px`, `--sp-4 16px`, `--sp-5 24px`, `--sp-6 32px`, `--sp-7 48px`.
- Radius: `--radius-sm 4px` (badges, inputs), `--radius-md 8px` (cards, buttons), `--radius-lg 12px` (dialogs, drawers).
- Elevation: cards `0 1px 2px rgb(0 0 0 / 0.08)`; dialogs and drawers `0 8px 24px rgb(0 0 0 / 0.16)`.
- Page gutter: 16px phone, 24px tablet, 32px desktop.

## App shell and navigation

Component: `AppShell` wraps every signed-in route.

```
Desktop (≥1024)                                   Phone (<600)
┌──────────────────────────────────────────────┐  ┌──────────────────────┐
│ PrototypeBanner (full width)                 │  │ PrototypeBanner      │
├──────────────────────────────────────────────┤  ├──────────────────────┤
│ TopBar: [app name]      [household] [avatar] │  │ TopBar: name  avatar │
├──────────┬───────────────────────────────────┤  ├──────────────────────┤
│ SideNav  │  <main> page content              │  │ <main>               │
│ (start = │                                   │  │                      │
│  right)  │                                   │  ├──────────────────────┤
│          │                                   │  │ BottomNav (4 items)  │
└──────────┴───────────────────────────────────┘  └──────────────────────┘
```

- **TopBar**: app name "ניהול כספי משפחה" (existing `he.appName`) at inline-start; household name (demo: "משק בית לדוגמה") and `UserMenu` (avatar initials, menu: "יציאה" sign out) at inline-end. Height 56px.
- **SideNav** (≥1024): fixed width 232px on the inline-start side (right in RTL). Items with icon + label. On tablet (600–1023) it collapses to an icon rail of 72px with tooltips.
- **BottomNav** (<600): fixed to the bottom, 4 items, icon + short label, `padding-block-end: env(safe-area-inset-bottom)`.
- Nav items (same order everywhere):

| Key | Label | Route | Icon |
|---|---|---|---|
| `nav.dashboard` | "לוח בקרה" | `/` | chart |
| `nav.transactions` | "תנועות" | `/transactions` | list |
| `nav.upload` | "העלאת מסמכים" (bottom nav: "העלאה") | `/upload` | upload; shows a count badge of documents waiting for review |
| `nav.household` | "משק הבית" | `/household` | people |

- Active item: `--primary` text, 3px `border-inline-start` bar (side nav) or top bar indicator (bottom nav), `aria-current="page"`.
- A "skip to content" link ("דילוג לתוכן") is the first focusable element.

### Prototype banner

Component `PrototypeBanner`, shown on every screen including sign-in, cannot be dismissed.

- Text: "אב-טיפוס · נתוני דמה" followed by the smaller "הנתונים בדויים. אין להעלות מסמכים אמיתיים." (Data is invented. Do not upload real documents.)
- Style: `--banner-bg` / `--banner-text`, height 32px, `--fs-sm`, centered, `role="note"`.
- Rationale: R-006 and R-029. The prototype file upload never reads file contents; see upload-and-review.md.

## Formatting

All formatting lives in one module, `apps/prototype/src/lib/format.ts`, with unit tests.

### Amounts

- Stored and passed as integer agorot (R-001). Never divide into a float.
- `formatAmount(agorot: number, opts?: { decimals?: 0 | 2; sign?: 'auto' | 'none' })`:
  1. Build the decimal string with integer operations only: `sign + Math.trunc(abs / 100) + '.' + String(abs % 100).padStart(2, '0')`.
  2. Pass the string to `new Intl.NumberFormat('he-IL', { style: 'currency', currency: 'ILS', minimumFractionDigits, maximumFractionDigits, signDisplay })` (`format()` accepts a decimal string, which keeps it exact).
  3. Output example: `123456` → "‏1,234.56 ₪"; with `decimals: 0` → "‏1,235 ₪".
- Tables and review: 2 decimals. Summary cards and chart labels: 0 decimals.
- Direction: expenses show "−" and `--expense`; income shows "+" and `--income`; transfers show no sign and `--transfer`. Type is stored separately from the amount, so the sign is presentation only.
- Foreign currency (D7): the ILS amount charged is primary; the original appears below in `--text-muted`, e.g. "‏€45.00 (מקור)". Format with `Intl.NumberFormat('he-IL', { style: 'currency', currency: originalCurrency })`.
- Always wrap in `<bdi class="amount">`.

### Dates

- Stored as ISO strings `YYYY-MM-DD`. Display `dd/mm/yyyy` by string slicing (`'2026-10-03'` → "03/10/2026"), not by `new Date()`, which avoids time-zone shifts.
- Month headings: "אוקטובר 2026" via `Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric', timeZone: 'UTC' })` on `Date.UTC(y, m - 1, 1)`.
- Short month for chart axis: `month: 'short'` ("אוק׳").
- Relative labels are not used in v0.1, except "היום" (today) on the Timeline marker.
- The prototype uses a fixed `DEMO_TODAY = '2026-10-15'` constant, never the real clock, so the demo always looks the same.

## Shared components (used by several screens)

| Component | Purpose |
|---|---|
| `AppShell`, `TopBar`, `SideNav`, `BottomNav`, `PrototypeBanner` | Shell, above |
| `Amount` | Renders `formatAmount` with colour and sign by type |
| `DateCell` | Renders `dd/mm/yyyy` |
| `TypeBadge` | "הכנסה" / "הוצאה" / "העברה" |
| `CategoryPicker` | Combobox (ARIA combobox pattern) of categories grouped by parent, type-to-search, shows only categories that fit the transaction type |
| `MemberTagPicker` | Multi-select chips of household members + "משפחה" (FR-41, FR-42) + free tags (FR-45) |
| `ConfidenceMark` | Low-confidence highlight on a field (tint + icon + tooltip) |
| `CertaintyBadge` | Verified / expected / estimate (preview layer only in v0.1) |
| `CoverageNote` | "מבוסס על …" line for every category view (ADR-004) |
| `Toast` with undo | Bottom, inline-centered, 6s, `aria-live="polite"` |
| `EmptyState` | Illustration-free: icon, title, one sentence, one primary action |
| `ErrorState` | Icon, plain reason, "נסו שוב" (retry) button |
| `Skeleton` | Grey blocks shaped like the content |

## Roles in the UI (D3)

| Action | Admin "מנהל/ת" | Partner "שותף/ה" | Limited "צפייה בלבד" |
|---|---|---|---|
| View all screens | yes | yes | yes |
| Upload, review, approve | yes | yes | no: upload nav item hidden, review is read-only |
| Edit and delete transactions | yes | yes | no: edit controls hidden, rows not clickable for edit |
| Manage members (labels) | yes | yes | no |
| Invite and remove users, change roles | yes | no | no |

The prototype has a role switcher in the `UserMenu` ("הצגה בתור: מנהל/ת / שותף/ה / צפייה בלבד") so the owner can try each role. It is a prototype-only control and is labelled "(אב-טיפוס)".

## Owner decisions (2026-11-26)
1. Forecast preview: stays in the prototype as an opt-in toggle, off by default, clearly labelled as phase 2.
2. Charts: time runs left to right; the rest of the layout is RTL.
3. Itemized card statement uploaded in v0.1: acknowledged with a note, nothing imported.
4. Coverage line: keep both the percentage and the account count.
5. Bulk edit and delete (FR-34): included in the prototype; may be deferred for v0.1 itself.

## Implementation notes (UX1 prototype, developer)
Where the prototype deviates from or fills gaps in these specs:
1. **Location.** Built as a separate app, `apps/prototype` (owner acceptance criteria), not in `apps/web`. The paths above map to `apps/prototype/src/locale/he.ts`, `src/styles.css` and `src/lib/format.ts`. Demo data lives in `src/demo/` as typed TypeScript (not `src/data/`, which the repo `.gitignore` excludes to protect tenant data). Transactions are generated by `scripts/generate-demo-data.ts` (seeded) into the committed `src/demo/transactions.generated.ts`.
2. **Routing.** Hash routing (`#/transactions?category=food`), no router dependency. The dashboard's expanded months are kept in memory, not in a `#open=` hash, because the hash holds the route.
3. **Mock sign-in.** `MockGoogleChooser` is not behind `VITE_PROTOTYPE`, since the whole app is the prototype. A review shortcut `?as=parent-a` / `?as=parent-b` (before the `#`) starts signed in. The invite screen (`/invite/accept?invite=<id>`) opens in the same tab and is reachable without a session, because a new tab would lose the in-memory state.
4. **Demo volume and counts.** The monthly pattern yields about 30 transactions per full month (not 45 to 60); September coverage hits the 63% target exactly. Upload history row counts are derived from the generated data (for example doc-003 shows "20 of 21"). `detected.accountId` became `accountIds[]` because doc-001 covers two accounts.
5. **Chart.** Hand-rolled SVG. Income/expense red and green fail the colour-blind separation check, so expense bars also carry a hatch texture (the legend shows it), and a text readout line under the chart replaces a floating tooltip (plus SVG titles and a visually hidden table).
6. **Preview layer.** When a future month is selected, the summary cards list verified / expected / estimate separately instead of one total, so certainties are never mixed. "שמירת השינוי" also updates later future items with the same description (from this month onward), each keeping its previous value in history.
7. **Income breakdown.** The coverage line for the income view shows the account count only; the percentage is defined for expenses.
8. **Bulk assign** adds the chosen members and tags to each selected row (it does not replace existing ones).
9. **Not built in the prototype:** full grid keyboard navigation (arrow keys between cells) on the review and transactions tables (row shortcuts A / R / J / K / Space and `/` for search are built; `C` / `M` are not), list virtualization, the full ARIA combobox pattern (pickers are a search field plus a listbox), the tablet filter popover (the desktop filter bar wraps instead), and simulated "still extracting" and intake-error states. Forced states via `?state=loading|empty|error` exist on the Dashboard, Transactions, upload history and Household.
10. **Keyboard shortcuts match the physical key** (`KeyboardEvent.code`: `KeyA`, `KeyR`, `KeyJ`, `KeyK`, `Space`, `Slash`), not `key`, so they work on a Hebrew keyboard layout. The real app must do the same.
11. **`?as=` sign-in shortcut is prototype only** and must never be carried into `apps/web`: the user and tenant come from the authenticated session only (R-003). Likewise the prototype invite link uses the user id; real invites need an unguessable, single-use, expiring token.
12. **Upload simulation** picks the outcome from a substring of the file name (`dup`, `fail`, `card`, otherwise a copy of doc-006); only the name and size are used, never the contents.
13. **Review category:** a review row keeps the extraction's `suggestedCategoryId` unchanged and stores the user's choice separately in `categoryId` (undefined until the user picks or confirms one; the suggestion is used and tagged "הצעה" until then).
