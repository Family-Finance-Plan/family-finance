# Upload and review

## Purpose

Bring transactions in from documents. The user uploads a file without choosing a document type, the system extracts rows, and the user reviews, corrects and approves them. Nothing enters the household's data before approval (R-008). Every upload is kept in a history list.

Prototype: no file contents are read or sent anywhere. Any picked or dropped file is accepted by name, size and extension only, and the "extraction" returns a canned demo result (demo-data.md). The upload zone says so.

## FR IDs covered

- FR-07 upload files with income and expense details
- FR-08 + D1 PDF, CSV, images and Excel (XLSX)
- FR-09 no document type choice before upload
- FR-10 the system identifies the document type (shown, not asked)
- FR-11 + D6 duplicate checks: same file before extraction; possible duplicate rows for the user to decide
- FR-12 show errors and rows that could not be parsed
- FR-13 review view before intake
- FR-14 + D4 only approved rows enter; every row needs approval in v0.1
- FR-15 upload log / history
- FR-16 correct amount, description (and date, type) on the review screen
- FR-17 change category on the review screen; D13 category is suggested, user confirms
- FR-18 change member/tag assignment on the review screen
- FR-21, FR-22 extraction of date, description, amount, type
- FR-23, FR-24, FR-20 + D4 confidence: low-confidence fields highlighted (no numeric threshold shown)
- FR-25 unparsed rows visible, fixable by hand, rows can be added by hand
- FR-26 + D5 unreadable documents: failed with a plain reason, kept in history, retry or manual entry
- D7 currency: missing currency defaults to ILS; original currency shown
- D10 10 MB per file
- D2 transfer type set by hand

## Routes

- `/upload` — upload zone + upload history (one page)
- `/upload/:documentId/review` — review screen for one document

## Screen 1: Upload (`/upload`)

### Layout

Desktop:
```
PageHeader: "העלאת מסמכים"
┌──────────────────────── UploadDropzone ─────────────────────────┐
│   [upload icon]                                                 │
│   "גררו לכאן קבצים או"  [בחירת קבצים]                           │
│   "PDF, Excel, CSV או תמונה · עד 10MB לקובץ"                    │
│   "אב-טיפוס: תוכן הקובץ לא נקרא. אין להעלות מסמכים אמיתיים."   │
└─────────────────────────────────────────────────────────────────┘
UploadQueue (files of this session, each with progress/status)
UploadHistory table
```
Phone: the dropzone becomes a compact card with one large button "בחירת קבצים" (drag and drop is not offered on touch); queue and history become card lists.

### `UploadDropzone`

- Accepts multiple files. `<input type="file" multiple accept=".pdf,.csv,.xlsx,.xls,.jpg,.jpeg,.png,.heic,application/pdf,text/csv,image/*,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet">`. The whole zone is a `<label>` for the input, so it is keyboard reachable (Enter/Space opens the picker).
- Drag over: border `--primary` 2px dashed, background `#EEF2FC`, text "שחררו כדי להעלות". `aria-live` announces "{n} קבצים נוספו".
- Client-side checks per file, before anything else:
  - Type not supported → queue item error "סוג הקובץ לא נתמך. אפשר להעלות PDF, Excel, CSV או תמונה."
  - Larger than 10 MB (D10) → "הקובץ גדול מ-10MB. נסו לפצל אותו או לייצא תקופה קצרה יותר."
- No document type select anywhere (FR-09).

### `UploadQueue` and processing states

Each file becomes an `UploadQueueItem` with file name (`<bdi>`), size, type icon and a status line. Statuses in order:

| Status | Copy | Visual |
|---|---|---|
| `uploading` | "מעלה… {p}%" | progress bar |
| `duplicate-file` (D6, before extraction) | "הקובץ הזה כבר הועלה ב-{date}." Buttons "ביטול" (default) and "להמשיך בכל זאת" | warning style; extraction does not start until the user chooses |
| `extracting` | "קורא את המסמך ומזהה תנועות…" + indeterminate bar. Sub-line after a few seconds: "זה יכול לקחת עד דקה." | |
| `ready` | "זוהה: דף חשבון בנק · חשבון עו״ש ב · 28/09/2026–15/10/2026 · {n} שורות" (FR-10). Primary "לבדיקה ואישור" | success style |
| `failed` (D5) | Plain reason, one of: "לא הצלחנו לקרוא את המסמך. ייתכן שהוא סרוק באיכות נמוכה." / "המסמך מוגן בסיסמה." / "לא מצאנו תנועות במסמך." Buttons "ניסיון נוסף" and "הזנה ידנית" (opens the review screen with an empty table and "הוספת שורה") | error style; nothing imported |

Prototype: the canned result depends on the file name so every state can be shown: a name containing `dup` → duplicate-file; `fail` → failed; `card` → a card statement result; anything else → a copy of the pending account B statement (doc-006) with its review rows (demo-data.md). Extraction takes a fake 2.5 seconds.

### `UploadHistory` (FR-15)

Title "היסטוריית העלאות". Table, newest first:

| Header | Content |
|---|---|
| "תאריך העלאה" | dd/mm/yyyy HH:mm |
| "קובץ" | file name + type icon |
| "זוהה כ" | e.g. "דף חשבון בנק · חשבון עו״ש א" or "—" |
| "הועלה על ידי" | member display name |
| "סטטוס" | badge: "ממתין לבדיקה" / "אושר ({n} תנועות)" / "אושר חלקית ({a} מתוך {b})" / "נדחה" / "נכשל" |
| action | "המשך בדיקה" for waiting, "צפייה" for others |

Empty: "עוד לא הועלו מסמכים." Loading: 3 skeleton rows. Error: `ErrorState` "לא הצלחנו לטעון את ההיסטוריה." + retry.

Limited role: the dropzone is replaced by a note "אין לך הרשאה להעלות מסמכים. אפשר לצפות בהיסטוריה." The history stays visible.

## Screen 2: Review before intake (`/upload/:documentId/review`)

### Layout

Desktop:
```
PageHeader: "בדיקה ואישור"   [file name] · זוהה: דף חשבון בנק · חשבון עו״ש ב · 28/09/2026–15/10/2026
ReviewSummaryBar:  {n} שורות · {a} לבדיקה (ביטחון נמוך) · {u} לא פוענחו · {d} כפילויות אפשריות
                   Filter tabs: [הכל] [דורש תשומת לב] [לא פוענחו] [כפילויות]
ReviewTable (sticky header)
StickyActionBar (bottom): "{k} נבחרו"  [אישור הנבחרות] [דחיית הנבחרות]  ···  [אישור כל השורות התקינות ({m})]
```
Phone: `ReviewCardList`, one card per row with the same fields stacked; a row opens `ReviewRowSheet` (bottom sheet) for editing; the action bar stays sticky at the bottom above the BottomNav.

### `ReviewTable` columns

| # | Header | Content and editing |
|---|---|---|
| 1 | checkbox | row selection; header checkbox selects visible rows |
| 2 | "תאריך" | `DateCell`; inline edit with a date input |
| 3 | "תיאור" | text; inline edit |
| 4 | "סוג" | select "הכנסה" / "הוצאה" / "העברה" (D2: transfer by hand) |
| 5 | "סכום" | `Amount` 2 decimals; inline edit (`inputmode="decimal"`, `dir="ltr"`). Foreign currency rows show the original underneath, "‏$120.00 (מקור)"; a row with no currency shows "₪ (ברירת מחדל)" in muted text (D7) |
| 6 | "קטגוריה" | `CategoryPicker` prefilled with the suggestion and a small "הצעה" tag until the user touches or confirms it (D13) |
| 7 | "שיוך" | `MemberTagPicker`, empty by default |
| 8 | "מצב" | `RowStatus` badge, see below |
| 9 | actions | "אישור" ✓ and "דחייה" ✕ icon buttons with labels for screen readers; for unparsed rows "תיקון" instead |

Rows are ordered as in the source document. A row is approved or rejected individually; decisions can be undone until the final "סיום וקליטה".

### Row status and highlighting

| Status | Badge | Row treatment |
|---|---|---|
| Ready | "תקין" | none |
| Low confidence on one or more fields (FR-23, FR-24, D4) | "לבדיקה" | each uncertain **field** gets `ConfidenceMark`: `--low-confidence` background, warning icon inside the cell at inline-end, tooltip "ביטחון נמוך – כדאי לבדוק". Editing or explicitly confirming the field (✓ on hover/focus "הערך נכון") clears the mark |
| Unparsed (FR-12, FR-25) | "לא פוענח" | full-row `--unparsed` tint; shows the raw source text in a monospace line: "טקסט מקורי: ‎{raw}"; date/amount cells empty and required. "תיקון" turns the row into editable fields; it cannot be approved until date, description, amount and type are filled |
| Possible duplicate (D6) | "כפילות אפשרית" | warning icon; an expandable line "דומה לתנועה קיימת: {date} · {description} · {amount} · {account}" with radio "לקלוט בכל זאת" / "לא לקלוט" (default: none, the user must decide). Nothing is removed automatically |
| Approved | "אושר" | `--income` check icon, row slightly muted, editing still allowed |
| Rejected | "נדחה" | strikethrough description, muted, "ביטול" link |
| Card charge (ADR-004) | "חיוב אשראי לא מפורט" | `--not-itemized` hatch; category fixed, not editable; can still be approved |

Low confidence is shown per field, never as a number or percent (FR-20 thresholds not decided).

### Bulk actions and final intake

- "אישור הנבחרות" / "דחיית הנבחרות" act on selected rows. Rows with open problems (unparsed, undecided duplicate) are skipped with a toast "{n} שורות דורשות טיפול לפני אישור".
- "אישור כל השורות התקינות ({m})" approves rows with status Ready only. Low-confidence rows are not included; the user approves them one by one or by selection (D4: every row needs approval, low-confidence ones need attention). Copy under the button: "שורות שמסומנות לבדיקה צריך לאשר בנפרד."
- "הוספת שורה" (link above the table) adds an empty manual row (FR-25, D5).
- Primary at the end: "סיום וקליטה". Enabled when every row is approved or rejected. Opens `ConfirmIntakeDialog`: "לקלוט {a} תנועות? {r} שורות שנדחו לא ייקלטו." Buttons "קליטה" and "חזרה לבדיקה".
- After intake: navigate to `/transactions?document={id}` with toast "נקלטו {a} תנועות מ-{file}." The history row becomes "אושר".
- Leaving with unsaved decisions: decisions are kept as a draft (status "ממתין לבדיקה") and the user can return. No "leave page" dialog needed in the prototype; show toast "הבדיקה נשמרה. אפשר להמשיך אחר כך."
- "דחיית המסמך כולו" (secondary, in an overflow menu "עוד"): confirm dialog, history status "נדחה", nothing imported.

### States

| State | What shows |
|---|---|
| Loading | Header skeleton + 8 skeleton rows |
| Still extracting (user opened the link early) | "המסמך עדיין בעיבוד…" with the indeterminate bar; auto-refreshes |
| Empty result | `EmptyState`: "לא נמצאו תנועות במסמך." Actions "הזנה ידנית" and "חזרה להעלאה" |
| Failed document | Same reason copy as the queue, plus "ניסיון נוסף" / "הזנה ידנית" |
| Error loading | `ErrorState` "לא הצלחנו לטעון את הבדיקה." + retry |
| Saving intake | Dialog button shows "קולט…", disabled |
| Intake error | Dialog stays open with "הקליטה נכשלה. שום תנועה לא נקלטה. נסו שוב." (all or nothing) |
| Limited role | Read-only table, no checkboxes or actions, banner "צפייה בלבד" |

## Keyboard

- Table is a grid: arrow keys move between cells, Enter edits a cell, Esc cancels the edit, Tab leaves the grid. `Space` toggles row selection. Shortcuts shown in a "קיצורי מקלדת" popover: `A` approve row, `R` reject row, `J`/`K` next/previous row needing attention.
- After approving a row, focus moves to the next row that is not approved.

## RTL notes

- Columns run from the right: checkbox first at inline-start, actions last at inline-end.
- `ConfidenceMark` icon at the inline-end of the cell, the value at inline-start.
- Raw source text from a document can be LTR (numbers, English merchant names): render it in `<bdi>`, monospace, with `unicode-bidi: plaintext` so its own direction wins.
- Progress bars fill from inline-start (right) to inline-end.
- The sticky action bar: summary text at inline-start, buttons at inline-end; the primary button is the last (leftmost).

## Development notes

- Components: `UploadPage`, `UploadDropzone`, `UploadQueue`, `UploadQueueItem`, `UploadHistory`, `ReviewPage`, `ReviewSummaryBar`, `ReviewFilterTabs`, `ReviewTable`, `ReviewRow`, `ReviewCardList`, `ReviewRowSheet`, `RowStatus`, `ConfidenceMark`, `DuplicateResolver`, `StickyActionBar`, `ConfirmIntakeDialog`.
- Data shape: a `ReviewDocument` with `rows: ReviewRow[]`; each row has `fields` and `lowConfidence: FieldName[]` (a list, not scores), `parseStatus: 'parsed' | 'unparsed'`, `raw?: string`, `duplicateOf?: transactionId`, `decision: 'pending' | 'approved' | 'rejected'`, `duplicateDecision?: 'keep' | 'skip'`. See demo-data.md.
- Approved rows move into the transactions collection only on "סיום וקליטה", as one atomic step (R-008). Until then the dashboard and transactions screen must not see them.
- Prototype upload: use `File.name`, `File.size`, `File.type` only. Do not call `FileReader`, do not keep the file, do not log names (R-015).
- Upload count badge in nav = documents with status "ממתין לבדיקה".

## Left out of v0.1

- One-off marking on the review screen (FR-19, phase 2).
- "Apply this category to similar rows" and learning from corrections (FR-51 to FR-58, FR-65, D13).
- Numeric confidence and auto-approve thresholds (FR-20 numbers open; D4).
- Itemized card statements as card transactions (Card Insights, phase 4). In the prototype a `card` file name returns a clear note: "זוהה פירוט כרטיס אשראי. פירוט כרטיסים יתווסף בהמשך; כרגע החיוב נקלט מדף הבנק כשורה אחת." and offers only "סגירה". Open question 3.
