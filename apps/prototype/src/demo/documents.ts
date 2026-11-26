import { demoTransactions } from "./transactions.generated";
import type { ReviewField, ReviewRow, TxType, UploadDocument } from "./types";

const countFor = (documentId: string): number =>
  demoTransactions.filter((t) => t.documentId === documentId).length;

/** Upload history (demo-data.md). Row counts are derived from the generated transactions. */
export const demoDocuments: UploadDocument[] = [
  {
    id: "doc-006",
    fileName: "statement-b-2026-10.pdf",
    sizeBytes: 182_340,
    uploadedAt: "2026-10-15T09:12",
    uploadedBy: "u-parent-b",
    detected: {
      kind: "bank-statement",
      accountIds: ["acc-b"],
      from: "2026-09-28",
      to: "2026-10-15",
    },
    status: "awaiting-review",
  },
  {
    id: "doc-004",
    fileName: "statement-a-2026-10.xlsx",
    sizeBytes: 24_810,
    uploadedAt: "2026-10-15T08:30",
    uploadedBy: "u-parent-a",
    detected: {
      kind: "bank-statement",
      accountIds: ["acc-a"],
      from: "2026-10-01",
      to: "2026-10-15",
    },
    status: "approved",
    approvedCount: countFor("doc-004"),
    totalRows: countFor("doc-004"),
  },
  {
    id: "doc-005",
    fileName: "scan-blurry.jpg",
    sizeBytes: 2_410_220,
    uploadedAt: "2026-10-14T21:40",
    uploadedBy: "u-parent-a",
    status: "failed",
    failureReason: "low-quality-scan",
  },
  {
    id: "doc-003",
    fileName: "statement-b-2026-09.csv",
    sizeBytes: 9_870,
    uploadedAt: "2026-10-02T19:05",
    uploadedBy: "u-parent-b",
    detected: {
      kind: "bank-statement",
      accountIds: ["acc-b"],
      from: "2026-09-01",
      to: "2026-09-30",
    },
    status: "partially-approved",
    // One summary line in the source was rejected.
    approvedCount: countFor("doc-003"),
    totalRows: countFor("doc-003") + 1,
  },
  {
    id: "doc-002",
    fileName: "statement-a-2026-09.pdf",
    sizeBytes: 164_002,
    uploadedAt: "2026-10-01T20:15",
    uploadedBy: "u-parent-a",
    detected: {
      kind: "bank-statement",
      accountIds: ["acc-a"],
      from: "2026-09-01",
      to: "2026-09-30",
    },
    status: "approved",
    approvedCount: countFor("doc-002"),
    totalRows: countFor("doc-002"),
  },
  {
    id: "doc-001",
    fileName: "statements-2026-08.pdf",
    sizeBytes: 311_506,
    uploadedAt: "2026-09-03T18:00",
    uploadedBy: "u-parent-a",
    detected: {
      kind: "bank-statement",
      accountIds: ["acc-a", "acc-b"],
      from: "2026-08-01",
      to: "2026-08-31",
    },
    status: "approved",
    approvedCount: countFor("doc-001"),
    totalRows: countFor("doc-001"),
  },
];

const duplicateTarget = demoTransactions.find(
  (t) =>
    t.accountId === "acc-b" &&
    t.date === "2026-09-29" &&
    t.amountAgorot === 33120,
);
if (!duplicateTarget)
  throw new Error("Demo data: the September row duplicated by r01 is missing");

function parsed(
  id: string,
  date: string,
  description: string,
  type: TxType,
  amountAgorot: number,
  suggestedCategoryId: string | null,
  lowConfidence: ReviewField[] = [],
  extra: Partial<ReviewRow> = {},
  currency: string | null = "ILS",
): ReviewRow {
  return {
    id,
    parseStatus: "parsed",
    fields: { date, description, type, amountAgorot, currency },
    suggestedCategoryId,
    memberIds: [],
    tagIds: [],
    lowConfidence,
    decision: "pending",
    ...extra,
  };
}

function unparsed(id: string, raw: string): ReviewRow {
  return {
    id,
    parseStatus: "unparsed",
    raw,
    fields: {},
    suggestedCategoryId: null,
    memberIds: [],
    tagIds: [],
    lowConfidence: [],
    decision: "pending",
  };
}

/** Review rows of doc-006 (account B, 2026-09-28 to 2026-10-15), in source order. */
export function doc006Rows(): ReviewRow[] {
  const r06 = parsed(
    "r06",
    "2026-10-07",
    "Example Travel Inc",
    "expense",
    46380,
    "vacations",
    ["amount"],
  );
  r06.fields.original = { currency: "USD", amountMinor: 12000 };
  return [
    parsed(
      "r01",
      "2026-09-29",
      "סופר שכונתי",
      "expense",
      33120,
      "supermarket",
      [],
      {
        duplicateOf: duplicateTarget?.id,
      },
    ),
    parsed("r02", "2026-10-01", "סופר שכונתי", "expense", 41270, "supermarket"),
    parsed("r03", "2026-10-03", "תחנת דלק לדוגמה", "expense", 27450, "fuel"),
    parsed("r04", "2026-10-05", "בית קפה לדוגמה", "expense", 4800, "cafes", [
      "category",
    ]),
    parsed(
      "r05",
      "2026-10-06",
      "Example Software Ltd",
      "expense",
      7120,
      "subscriptions",
      ["category"],
      {},
      null,
    ),
    r06,
    parsed("r07", "2026-10-08", "סופר שכונתי", "expense", 38810, "supermarket"),
    parsed(
      "r08",
      "2026-10-09",
      "קופת חולים – השתתפות",
      "expense",
      3500,
      "doctors",
      ["description"],
    ),
    parsed(
      "r09",
      "2026-10-10",
      "משכורת – מעסיק ב בע״מ",
      "income",
      1180000,
      "salary-parent-b",
      [],
      {
        memberIds: ["m-parent-b"],
      },
    ),
    parsed(
      "r10",
      "2026-10-11",
      "העברה לחשבון עו״ש א",
      "expense",
      400000,
      null,
      ["type"],
    ),
    parsed(
      "r11",
      "2026-10-01",
      "מסעדה לדוגמה",
      "expense",
      18650,
      "restaurants",
      ["date"],
    ),
    unparsed("r12", "12/10 ‏*** חיוב לא מזוהה 1,2?4.00"),
    parsed(
      "r13",
      "2026-10-12",
      "בית מרקחת לדוגמה",
      "expense",
      6390,
      "medicine",
    ),
    unparsed("r14", 'סה"כ לתקופה ‎ 18,442.10'),
    parsed(
      "r15",
      "2026-10-13",
      "חנות צעצועים לדוגמה",
      "expense",
      12900,
      "toys",
      ["category"],
    ),
    parsed("r16", "2026-10-14", "תחנת דלק לדוגמה", "expense", 24100, "fuel"),
    parsed(
      "r17",
      "2026-10-15",
      "החזר – חנות נעליים לדוגמה",
      "income",
      8900,
      "refunds",
      ["type", "category"],
    ),
    parsed("r18", "2026-10-15", "סופר שכונתי", "expense", 29560, "supermarket"),
  ];
}
