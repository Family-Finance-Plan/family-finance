# Demo data for the v0.1 prototype

Everything here is invented (R-006, R-029). No real names, emails, account numbers or figures. Names are roles ("הורה א"); emails use the reserved `example.com` domain; accounts have no numbers. The developer generates the full data from this description into `apps/prototype/src/demo/` as typed TypeScript (`household.ts`, `transactions.generated.ts`, `documents.ts`, `future-items.ts`). Hebrew strings in the demo JSON are data, not UI copy, so they live with the demo data and not in the locale file.

Fixed clock: `DEMO_TODAY = '2026-10-15'`.

## The story

A household of two parents and two children. Two bank accounts and one credit card. Three months of history: August and September 2026 complete, October up to today. Account B's October statement has been uploaded but is still waiting for review, so October is incomplete for account B. That one document drives the review screen demo, and approving it visibly changes the Dashboard.

## Household

```json
{
  "household": { "id": "hh-demo", "name": "משק בית לדוגמה" },
  "members": [
    { "id": "m-family", "name": "משפחה", "kind": "family", "color": "#4A5568" },
    { "id": "m-parent-a", "name": "הורה א", "kind": "person", "color": "#2952CC", "userId": "u-parent-a" },
    { "id": "m-parent-b", "name": "הורה ב", "kind": "person", "color": "#9C2A6B", "userId": "u-parent-b" },
    { "id": "m-child-a", "name": "ילד א", "kind": "person", "color": "#0F6E6E" },
    { "id": "m-child-b", "name": "ילד ב", "kind": "person", "color": "#8A5300" }
  ],
  "users": [
    { "id": "u-parent-a", "displayName": "הורה א", "email": "parent-a@example.com", "role": "admin", "status": "active" },
    { "id": "u-parent-b", "displayName": "הורה ב", "email": "parent-b@example.com", "role": "partner", "status": "active" },
    { "id": "u-invited", "displayName": "סבתא (דוגמה)", "email": "invited-user@example.com", "role": "limited", "status": "invited", "invitedAt": "2026-10-12" }
  ],
  "tags": [
    { "id": "t-vacation", "name": "חופשה" },
    { "id": "t-renovation", "name": "שיפוץ" },
    { "id": "t-classes", "name": "חוגים" }
  ]
}
```

Mock sign-in identities (sign-in.md): "הורה א (מנהל/ת)" → `u-parent-a`; "הורה ב (שותף/ה)" → `u-parent-b`; "משתמש/ת חדש/ה (ללא משק בית)" → a user with no household, goes to `/setup`, and the setup creates a second, empty in-memory household.

## Accounts

```json
[
  { "id": "acc-a", "name": "חשבון עו״ש א", "kind": "bank", "currency": "ILS" },
  { "id": "acc-b", "name": "חשבון עו״ש ב", "kind": "bank", "currency": "ILS" },
  { "id": "card-a", "name": "כרטיס אשראי א", "kind": "card", "chargedTo": "acc-a", "itemized": false }
]
```

The card has no transactions of its own in v0.1. Its monthly charge appears as one row in `acc-a` with `status: "card-charge-not-itemized"` (ADR-004).

Data coverage per account (drives `CompletenessNote`):

| Account | Data from | Data until |
|---|---|---|
| acc-a | 2026-08-01 | 2026-10-15 |
| acc-b | 2026-08-01 | 2026-09-30 (October waits for review) |

## Categories (D8: the spec's draft list is the editable default)

IDs are stable English slugs; names are Hebrew data. `type` limits which transactions can use them.

Expense (FR-61, FR-62):

| id | Name | Subcategories (id: name) |
|---|---|---|
| `housing` | "דיור ואחזקת הבית" | `mortgage`: "משכנתא", `arnona`: "ארנונה", `electricity`: "חשמל", `water`: "מים", `gas`: "גז", `building`: "ועד בית", `repairs`: "תחזוקה ותיקונים" |
| `food` | "מזון וקניות" | `supermarket`: "סופרמרקט", `household-shopping`: "קניות לבית", `restaurants`: "מסעדות", `delivery`: "משלוחים", `cafes`: "בתי קפה" |
| `kids` | "ילדים ומשפחה" | `education`: "מסגרות חינוך", `after-school`: "חוגים", `kids-clothing`: "ביגוד", `toys`: "צעצועים", `baby`: "ציוד לתינוקות", `kids-health`: "בריאות ילדים" |
| `transport` | "תחבורה ורכב" | `fuel`: "דלק", `car-insurance`: "ביטוח רכב", `service`: "טיפולים", `vehicle-test`: "טסט", `parking`: "חניה", `public-transport`: "תחבורה ציבורית" |
| `health` | "בריאות ורווחה" | `medicine`: "תרופות", `doctors`: "רופאים", `health-insurance`: "ביטוח", `treatments`: "טיפולים", `gym`: "חדר כושר" |
| `personal` | "צריכה אישית" | `clothing`: "ביגוד", `shoes`: "הנעלה", `grooming`: "טיפוח", `hairdresser`: "מספרה", `electronics`: "מוצרי חשמל ואלקטרוניקה" |
| `leisure` | "פנאי ובילוי" | `vacations`: "חופשות", `trips`: "טיולים", `shows`: "הופעות", `hobbies`: "תחביבים", `subscriptions`: "מנויים" |
| `financial` | "הוצאות פיננסיות" | `bank-fees`: "עמלות בנק", `interest`: "ריבית", `management-fees`: "דמי ניהול", `loan-repayment`: "החזרי הלוואות" |
| `other` | "אחר" | `unclassified`: "טרם סווג", `special`: "הוצאות מיוחדות", `misc`: "שונות" |

Income (FR-63):

| id | Name |
|---|---|
| `salary-parent-a` | "משכורת – הורה א" (generated per person member) |
| `salary-parent-b` | "משכורת – הורה ב" |
| `business` | "הכנסה מעסק או עבודה נוספת" |
| `benefits` | "קצבאות והטבות" |
| `rent` | "הכנסה משכירות" |
| `investment-income` | "הכנסה מהשקעות" |
| `refunds` | "החזרים וזיכויים" |
| `one-time-income` | "הכנסה חד-פעמית" |

Transfers have no category. The "uncategorized" state is `categoryId: null`, shown as "טרם סווג".

## Transaction shape

```ts
type Transaction = {
  id: string;                       // uuid in the real app; "tx-0001" is fine in the demo
  accountId: 'acc-a' | 'acc-b';
  date: string;                     // ISO 'YYYY-MM-DD'
  description: string;
  type: 'income' | 'expense' | 'transfer';
  amountAgorot: number;             // positive integer, ILS charged; direction comes from type
  original?: { currency: string; amountMinor: number };  // D7, e.g. USD cents
  categoryId: string | null;        // subcategory id, or null
  memberIds: string[];              // includes 'm-family' for shared
  tagIds: string[];
  status?: 'card-charge-not-itemized';
  documentId: string;               // the upload it came from
  deletedAt?: string;               // D11
  history: { at: string; by: string; field: string; from: unknown; to: unknown }[];
};
```

Volume: about 45 to 60 transactions per full month per household, about 25 for October 1 to 15. Account A carries most of it.

## Monthly pattern (generate each month from this)

Amounts in agorot. Small random variation (±10%) is fine for variable items; fixed items stay fixed.

| Day | Account | Description | Type | Amount (agorot) | Category | Members |
|---|---|---|---|---|---|---|
| 01 | acc-a | "משכנתא – בנק לדוגמה" | expense | 485000 | mortgage | m-family |
| 02 | acc-a | "ארנונה – עירייה לדוגמה" (every 2 months: Aug, Oct) | expense | 98000 | arnona | m-family |
| 05 | acc-a | "גן ילדים – הוראת קבע" | expense | 210000 | education | m-child-b |
| 05 | acc-a | "חוג כדורגל" | expense | 28000 | after-school | m-child-a, tag t-classes |
| 10 | acc-a | "משכורת – מעסיק א בע״מ" | income | 1450000 | salary-parent-a | m-parent-a |
| 10 | acc-b | "משכורת – מעסיק ב בע״מ" | income | 1180000 | salary-parent-b | m-parent-b |
| 10 | acc-a | "חיוב כרטיס אשראי א" | expense | Aug 684250, Sep 712040, Oct 655310 | none (status card-charge-not-itemized) | m-family |
| 12 | acc-b | "העברה לחשבון עו״ש א" | transfer | 400000 | none | m-family |
| 12 | acc-a | "העברה מחשבון עו״ש ב" | transfer | 400000 | none | m-family |
| 15 | acc-a | "חברת חשמל לדוגמה" (Aug, Oct) | expense | 54000 to 62000 | electricity | m-family |
| 18 | acc-a | "תאגיד מים לדוגמה" (Sep) | expense | 21000 | water | m-family |
| 20 | acc-b | "ביטוח רכב – חברת ביטוח לדוגמה" | expense | 31500 | car-insurance | m-parent-b |
| 25 | acc-b | "קופת חולים – השתתפות עצמית" | expense | 3500 to 12000 | doctors | varies |
| 28 | acc-a | "ועד בית" | expense | 25000 | building | m-family |
| 30 | acc-a | "עמלת ניהול חשבון" | expense | 1290 | bank-fees | m-family |
| weekly | acc-b | "סופר שכונתי" | expense | 25000 to 48000 | supermarket | m-family |
| 2 to 3× | acc-b | "תחנת דלק לדוגמה" | expense | 22000 to 31000 | fuel | m-parent-a or m-parent-b |
| 3 to 5× | acc-b | "בית קפה לדוגמה", "מסעדה לדוגמה", "משלוח – אפליקציה לדוגמה" | expense | 3800 to 26000 | cafes / restaurants / delivery | varies |
| 1 to 3× | acc-b | "בית מרקחת לדוגמה" | expense | 2900 to 9500 | medicine | varies |

One-off and special items:

| Date | Account | Description | Type | Amount | Category | Members / tags | Purpose in demo |
|---|---|---|---|---|---|---|---|
| 2026-08-14 | acc-b | "מלון לדוגמה – אילת" | expense | 384000 | vacations | m-family, t-vacation | a big August expense |
| 2026-08-21 | acc-b | "Example Streaming Co" | expense | 4590, original USD 1199 | subscriptions | m-family | foreign currency display (D7) |
| 2026-09-07 | acc-b | "חנות חומרי בניין לדוגמה" | expense | 126500 | repairs | m-family, t-renovation | |
| 2026-09-16 | acc-a | "החזר מס הכנסה" | income | 85000 | refunds | m-parent-a | second income category |
| 2026-09-22 | acc-b | "חנות נעליים לדוגמה" | expense | 34900 | kids-clothing | m-child-a, m-child-b | multi-member assignment (FR-41) |
| 2026-10-04 | acc-a | "Example Online Store" | expense | 18990 | null | [] | uncategorized row, feeds "טרם סווג" and coverage |
| 2026-10-08 | acc-a | "העברה לחיסכון" | transfer | 150000 | none | m-family | transfer excluded from totals |
| 2026-09-03 | acc-b | "סופר שכונתי" | expense | 31240 | supermarket | m-family | `deletedAt: "2026-10-01"`, for the restore demo |

Coverage check for September (target, so the `CoverageNote` shows a believable figure): the card charge of 712040 out of roughly 1,950,000 total expenses → about 63% itemized and categorized; display "מבוסס על 63% מההוצאות · 2 מתוך 3 חשבונות". The generator should print each month's coverage so the figure in the UI can be checked by hand.

## Uploads and documents

```ts
type UploadDocument = {
  id: string; fileName: string; sizeBytes: number; uploadedAt: string; uploadedBy: string;
  detected?: { kind: 'bank-statement' | 'card-statement'; accountId?: string; from: string; to: string };
  status: 'awaiting-review' | 'approved' | 'partially-approved' | 'rejected' | 'failed';
  failureReason?: 'low-quality-scan' | 'password-protected' | 'no-transactions';
  approvedCount?: number; totalRows?: number;
};
```

History list (newest first):

| id | fileName | uploadedAt | by | detected | status |
|---|---|---|---|---|---|
| doc-006 | `statement-b-2026-10.pdf` | 2026-10-15 09:12 | u-parent-b | bank, acc-b, 2026-09-28 to 2026-10-15 | awaiting-review |
| doc-004 | `statement-a-2026-10.xlsx` | 2026-10-15 08:30 | u-parent-a | bank, acc-a, 2026-10-01 to 2026-10-15 | approved (24 of 24) |
| doc-005 | `scan-blurry.jpg` | 2026-10-14 21:40 | u-parent-a | none | failed, low-quality-scan |
| doc-003 | `statement-b-2026-09.csv` | 2026-10-02 19:05 | u-parent-b | bank, acc-b, 2026-09-01 to 2026-09-30 | partially-approved (31 of 32) |
| doc-002 | `statement-a-2026-09.pdf` | 2026-10-01 20:15 | u-parent-a | bank, acc-a, 2026-09-01 to 2026-09-30 | approved |
| doc-001 | `statements-2026-08.pdf` | 2026-09-03 18:00 | u-parent-a | bank, acc-a and acc-b, 2026-08 | approved |

(The ids are labels only; the UI sorts by `uploadedAt`.)

## Review rows (doc-006, account B, 2026-09-28 to 2026-10-15)

```ts
type ReviewRow = {
  id: string;
  parseStatus: 'parsed' | 'unparsed';
  raw?: string;                                   // source text, shown for unparsed rows
  fields: { date?: string; description?: string; type?: 'income' | 'expense' | 'transfer';
            amountAgorot?: number; currency?: string | null; original?: { currency: string; amountMinor: number } };
  suggestedCategoryId: string | null;             // D13
  memberIds: string[]; tagIds: string[];
  lowConfidence: Array<'date' | 'description' | 'type' | 'amount' | 'category'>;
  duplicateOf?: string;                           // existing transaction id (D6)
  status?: 'card-charge-not-itemized';
  decision: 'pending' | 'approved' | 'rejected';
  duplicateDecision?: 'keep' | 'skip';
};
```

About 18 rows. Representative examples (include all of these):

| # | date | description | type | amount (agorot) | currency | suggested category | lowConfidence | other | Shows |
|---|---|---|---|---|---|---|---|---|---|
| r01 | 2026-09-29 | "סופר שכונתי" | expense | 33120 | ILS | supermarket | [] | `duplicateOf` the existing acc-b transaction on 2026-09-29 with the same date, amount, direction and description (the generator must create that September row) | possible duplicate (D6) |
| r02 | 2026-10-01 | "סופר שכונתי" | expense | 41270 | ILS | supermarket | [] | | ready |
| r03 | 2026-10-03 | "תחנת דלק לדוגמה" | expense | 27450 | ILS | fuel | [] | | ready |
| r04 | 2026-10-05 | "בית קפה לדוגמה" | expense | 4800 | ILS | cafes | ["category"] | | low confidence on category only |
| r05 | 2026-10-06 | "Example Software Ltd" | expense | 7120 | null (no currency in source) | subscriptions | ["category"] | | "₪ (ברירת מחדל)" (D7) |
| r06 | 2026-10-07 | "Example Travel Inc" | expense | 46380 | ILS, original USD 12000 | vacations | ["amount"] | | foreign currency + low-confidence amount |
| r07 | 2026-10-08 | "סופר שכונתי" | expense | 38810 | ILS | supermarket | [] | | ready |
| r08 | 2026-10-09 | "קופת חולים – השתתפות" | expense | 3500 | ILS | doctors | ["description"] | | low-confidence description |
| r09 | 2026-10-10 | "משכורת – מעסיק ב בע״מ" | income | 1180000 | ILS | salary-parent-b | [] | memberIds ["m-parent-b"] prefilled | income row |
| r10 | 2026-10-11 | "העברה לחשבון עו״ש א" | expense | 400000 | ILS | null | ["type"] | | should be a transfer; user switches type to "העברה" (D2) |
| r11 | 2026-10-1? | "מסעדה לדוגמה" | expense | 18650 | ILS | restaurants | ["date"] | date extracted as 2026-10-01 but likely 2026-10-11 | low-confidence date |
| r12 | — | — | — | — | — | null | [] | `parseStatus: "unparsed"`, `raw: "12/10 ‏*** חיוב לא מזוהה 1,2?4.00"` | unparsed row (FR-12, FR-25) |
| r13 | 2026-10-12 | "בית מרקחת לדוגמה" | expense | 6390 | ILS | medicine | [] | | ready |
| r14 | — | — | — | — | — | null | [] | `parseStatus: "unparsed"`, `raw: "סה\"כ לתקופה ‎ 18,442.10"` | a summary line the user should reject |
| r15 | 2026-10-13 | "חנות צעצועים לדוגמה" | expense | 12900 | ILS | toys | ["category"] | | |
| r16 | 2026-10-14 | "תחנת דלק לדוגמה" | expense | 24100 | ILS | fuel | [] | | ready |
| r17 | 2026-10-15 | "החזר – חנות נעליים לדוגמה" | income | 8900 | ILS | refunds | ["type", "category"] | | refund that could be mistaken for an expense |
| r18 | 2026-10-15 | "סופר שכונתי" | expense | 29560 | ILS | supermarket | [] | | ready |

Write r11's date in JSON as `"2026-10-01"` with `lowConfidence: ["date"]`; the "?" above is only a note.

Canned results for other uploads in the prototype (upload-and-review.md): a file name containing `dup` returns "already uploaded on 2026-10-15 09:12" for doc-006; `fail` returns a failed document with `password-protected`; `card` returns the card-statement note; any other name returns a copy of doc-006 with fresh ids.

## Future items (Dashboard preview layer only, phase 2)

```ts
type FutureItem = {
  id: string; date: string; description: string;
  type: 'income' | 'expense';
  amountAgorot: number;
  certainty: 'verified' | 'expected' | 'estimate';   // required, never mixed (R-009)
  categoryId: string | null; memberIds: string[];
  temporaryEstimate?: { amountAgorot: number };       // set by "הערכה זמנית בלבד"
  history: { effectiveFrom: string; from: number; to: number; at: string; by: string }[];  // set by "שמירת השינוי" (R-010)
};
```

| id | date | description | type | amount | certainty | Why this certainty |
|---|---|---|---|---|---|---|
| f01 | 2026-10-20 | "ביטוח רכב" | expense | 31500 | verified | fixed standing order |
| f02 | 2026-10-25 | "קופת חולים" | expense | 6000 | estimate | varies |
| f03 | 2026-10-28 | "ועד בית" | expense | 25000 | verified | fixed |
| f04 | 2026-11-01 | "משכנתא" | expense | 485000 | verified | contract |
| f05 | 2026-11-05 | "גן ילדים" | expense | 210000 | verified | standing order |
| f06 | 2026-11-10 | "משכורת – הורה א" | income | 1450000 | expected | regular, not guaranteed |
| f07 | 2026-11-10 | "משכורת – הורה ב" | income | 1180000 | expected | regular |
| f08 | 2026-11-10 | "חיוב כרטיס אשראי א" | expense | 680000 | estimate | average of 3 months |
| f09 | 2026-12-01 | "משכנתא" | expense | 485000 | verified | contract |
| f10 | 2026-12-10 | "משכורת – הורה ב (אחרי העלאה)" | income | 1250000 | expected | announced raise from December (FR-70) |
| f11 | 2026-12-10 | "בונוס שנתי – הורה א" | income | 800000 | estimate | not confirmed (FR-69) |
| f12 | 2026-12-10 | "חיוב כרטיס אשראי א" | expense | 720000 | estimate | holiday season |

## Generation notes for the developer

- Use a seeded random generator so the JSON is the same on every run, and commit the generated JSON, not the generator output at runtime.
- Keep descriptions obviously fictional: "לדוגמה" in Hebrew names, "Example …" in Latin ones. No real company, bank or person names.
- All amounts are positive integers in agorot; never write decimals in the JSON.
- A unit test should assert: no transaction has a float amount; every future item has a certainty; transfers never appear in income/expense totals; no email outside `@example.com`.
