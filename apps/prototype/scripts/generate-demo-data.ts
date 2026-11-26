/**
 * Generates the prototype's demo transactions from the monthly pattern in docs/ux/demo-data.md.
 * Seeded, so every run gives the same output. The output is committed; the app never generates
 * data at runtime. Run: `pnpm --filter @family-finance/prototype generate:demo`, then `pnpm format`.
 *
 * Everything here is invented (R-006, R-029): "לדוגמה" / "Example …" names, no real figures.
 */
import { writeFileSync } from "node:fs";
import type { Transaction, TxType } from "../src/demo/types.ts";

const SEED = 20261015;
const DEMO_TODAY = "2026-10-15";

// mulberry32: tiny deterministic PRNG.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(SEED);
const int = (min: number, max: number): number =>
  min + Math.floor(rand() * (max - min + 1));
/** Random amount in agorot within [min, max], rounded to 10 agorot. */
const amount = (min: number, max: number): number =>
  int(min / 10, max / 10) * 10;
const pick = <T>(items: readonly T[]): T =>
  items[int(0, items.length - 1)] as T;
function distinctDays(count: number, min: number, max: number): number[] {
  const days = new Set<number>();
  while (days.size < count) days.add(int(min, max));
  return [...days];
}

const persons = ["m-parent-a", "m-parent-b", "m-child-a", "m-child-b"] as const;
const parents = ["m-parent-a", "m-parent-b"] as const;

interface Draft {
  accountId: "acc-a" | "acc-b";
  day: number;
  description: string;
  type: TxType;
  amountAgorot: number;
  categoryId: string | null;
  memberIds: string[];
  tagIds?: string[];
  status?: "card-charge-not-itemized";
  original?: { currency: string; amountMinor: number };
  deletedAt?: string;
}

const months = [
  { ym: "2026-08", days: 31, accounts: ["acc-a", "acc-b"], card: 684250 },
  { ym: "2026-09", days: 30, accounts: ["acc-a", "acc-b"], card: 712040 },
  // October: account A up to DEMO_TODAY; account B's October waits for review (doc-006).
  { ym: "2026-10", days: 15, accounts: ["acc-a"], card: 655310 },
] as const;

const documentFor: Record<string, Record<string, string>> = {
  "2026-08": { "acc-a": "doc-001", "acc-b": "doc-001" },
  "2026-09": { "acc-a": "doc-002", "acc-b": "doc-003" },
  "2026-10": { "acc-a": "doc-004" },
};

function monthDrafts(ym: string, card: number): Draft[] {
  const fam = ["m-family"];
  const d: Draft[] = [];
  const month = Number(ym.slice(5, 7));
  // Account A: fixed items.
  d.push({
    accountId: "acc-a",
    day: 1,
    description: "משכנתא – בנק לדוגמה",
    type: "expense",
    amountAgorot: 485000,
    categoryId: "mortgage",
    memberIds: fam,
  });
  if (month === 8 || month === 10) {
    d.push({
      accountId: "acc-a",
      day: 2,
      description: "ארנונה – עירייה לדוגמה",
      type: "expense",
      amountAgorot: 98000,
      categoryId: "arnona",
      memberIds: fam,
    });
  }
  d.push({
    accountId: "acc-a",
    day: 5,
    description: "גן ילדים – הוראת קבע",
    type: "expense",
    amountAgorot: 210000,
    categoryId: "education",
    memberIds: ["m-child-b"],
  });
  d.push({
    accountId: "acc-a",
    day: 5,
    description: "חוג כדורגל",
    type: "expense",
    amountAgorot: 28000,
    categoryId: "after-school",
    memberIds: ["m-child-a"],
    tagIds: ["t-classes"],
  });
  d.push({
    accountId: "acc-a",
    day: 10,
    description: "משכורת – מעסיק א בע״מ",
    type: "income",
    amountAgorot: 1450000,
    categoryId: "salary-parent-a",
    memberIds: ["m-parent-a"],
  });
  d.push({
    accountId: "acc-a",
    day: 10,
    description: "חיוב כרטיס אשראי א",
    type: "expense",
    amountAgorot: card,
    categoryId: null,
    memberIds: fam,
    status: "card-charge-not-itemized",
  });
  d.push({
    accountId: "acc-a",
    day: 12,
    description: "העברה מחשבון עו״ש ב",
    type: "transfer",
    amountAgorot: 400000,
    categoryId: null,
    memberIds: fam,
  });
  if (month === 8 || month === 10) {
    d.push({
      accountId: "acc-a",
      day: 15,
      description: "חברת חשמל לדוגמה",
      type: "expense",
      amountAgorot: amount(54000, 62000),
      categoryId: "electricity",
      memberIds: fam,
    });
  }
  if (month === 9) {
    d.push({
      accountId: "acc-a",
      day: 18,
      description: "תאגיד מים לדוגמה",
      type: "expense",
      amountAgorot: 21000,
      categoryId: "water",
      memberIds: fam,
    });
  }
  d.push({
    accountId: "acc-a",
    day: 28,
    description: "ועד בית",
    type: "expense",
    amountAgorot: 25000,
    categoryId: "building",
    memberIds: fam,
  });
  d.push({
    accountId: "acc-a",
    day: 30,
    description: "עמלת ניהול חשבון",
    type: "expense",
    amountAgorot: 1290,
    categoryId: "bank-fees",
    memberIds: fam,
  });

  // Account B: fixed and variable items.
  d.push({
    accountId: "acc-b",
    day: 10,
    description: "משכורת – מעסיק ב בע״מ",
    type: "income",
    amountAgorot: 1180000,
    categoryId: "salary-parent-b",
    memberIds: ["m-parent-b"],
  });
  d.push({
    accountId: "acc-b",
    day: 12,
    description: "העברה לחשבון עו״ש א",
    type: "transfer",
    amountAgorot: 400000,
    categoryId: null,
    memberIds: fam,
  });
  d.push({
    accountId: "acc-b",
    day: 20,
    description: "ביטוח רכב – חברת ביטוח לדוגמה",
    type: "expense",
    amountAgorot: 31500,
    categoryId: "car-insurance",
    memberIds: ["m-parent-b"],
  });
  d.push({
    accountId: "acc-b",
    day: 25,
    description: "קופת חולים – השתתפות עצמית",
    type: "expense",
    amountAgorot: amount(3500, 12000),
    categoryId: "doctors",
    memberIds: [pick(persons)],
  });
  const superDays = month === 8 ? [1, 8, 15, 22, 29] : [8, 15, 22];
  for (const day of superDays) {
    d.push({
      accountId: "acc-b",
      day,
      description: "סופר שכונתי",
      type: "expense",
      amountAgorot: amount(25000, 48000),
      categoryId: "supermarket",
      memberIds: fam,
    });
  }
  if (month === 9) {
    // The existing row that review row r01 (doc-006) duplicates (D6).
    d.push({
      accountId: "acc-b",
      day: 29,
      description: "סופר שכונתי",
      type: "expense",
      amountAgorot: 33120,
      categoryId: "supermarket",
      memberIds: fam,
    });
  }
  for (const day of distinctDays(int(2, 3), 2, 27)) {
    d.push({
      accountId: "acc-b",
      day,
      description: "תחנת דלק לדוגמה",
      type: "expense",
      amountAgorot: amount(22000, 31000),
      categoryId: "fuel",
      memberIds: [pick(parents)],
    });
  }
  const eatingOut = [
    ["בית קפה לדוגמה", "cafes", 3800, 9000],
    ["מסעדה לדוגמה", "restaurants", 12000, 26000],
    ["משלוח – אפליקציה לדוגמה", "delivery", 6000, 14000],
  ] as const;
  for (const day of distinctDays(int(3, 5), 1, 28)) {
    const [description, categoryId, min, max] = pick(eatingOut);
    d.push({
      accountId: "acc-b",
      day,
      description,
      type: "expense",
      amountAgorot: amount(min, max),
      categoryId,
      memberIds: [pick([...persons, "m-family"])],
    });
  }
  for (const day of distinctDays(int(1, 3), 1, 28)) {
    d.push({
      accountId: "acc-b",
      day,
      description: "בית מרקחת לדוגמה",
      type: "expense",
      amountAgorot: amount(2900, 9500),
      categoryId: "medicine",
      memberIds: [pick(persons)],
    });
  }
  return d;
}

const specials: (Draft & { ym: string })[] = [
  {
    ym: "2026-08",
    accountId: "acc-b",
    day: 14,
    description: "מלון לדוגמה – אילת",
    type: "expense",
    amountAgorot: 384000,
    categoryId: "vacations",
    memberIds: ["m-family"],
    tagIds: ["t-vacation"],
  },
  {
    ym: "2026-08",
    accountId: "acc-b",
    day: 21,
    description: "Example Streaming Co",
    type: "expense",
    amountAgorot: 4590,
    categoryId: "subscriptions",
    memberIds: ["m-family"],
    original: { currency: "USD", amountMinor: 1199 },
  },
  {
    ym: "2026-09",
    accountId: "acc-b",
    day: 7,
    description: "חנות חומרי בניין לדוגמה",
    type: "expense",
    amountAgorot: 126500,
    categoryId: "repairs",
    memberIds: ["m-family"],
    tagIds: ["t-renovation"],
  },
  {
    ym: "2026-09",
    accountId: "acc-a",
    day: 16,
    description: "החזר מס הכנסה",
    type: "income",
    amountAgorot: 85000,
    categoryId: "refunds",
    memberIds: ["m-parent-a"],
  },
  {
    ym: "2026-09",
    accountId: "acc-b",
    day: 22,
    description: "חנות נעליים לדוגמה",
    type: "expense",
    amountAgorot: 34900,
    categoryId: "kids-clothing",
    memberIds: ["m-child-a", "m-child-b"],
  },
  {
    ym: "2026-10",
    accountId: "acc-a",
    day: 4,
    description: "Example Online Store",
    type: "expense",
    amountAgorot: 18990,
    categoryId: null,
    memberIds: [],
  },
  {
    ym: "2026-10",
    accountId: "acc-a",
    day: 8,
    description: "העברה לחיסכון",
    type: "transfer",
    amountAgorot: 150000,
    categoryId: null,
    memberIds: ["m-family"],
  },
  {
    ym: "2026-09",
    accountId: "acc-b",
    day: 3,
    description: "סופר שכונתי",
    type: "expense",
    amountAgorot: 31240,
    categoryId: "supermarket",
    memberIds: ["m-family"],
    deletedAt: "2026-10-01",
  },
];

const pad = (n: number): string => String(n).padStart(2, "0");
const all: Omit<Transaction, "id" | "history">[] = [];
for (const m of months) {
  const drafts = [
    ...monthDrafts(m.ym, m.card),
    ...specials.filter((s) => s.ym === m.ym),
  ];
  for (const dr of drafts) {
    if (!(m.accounts as readonly string[]).includes(dr.accountId)) continue;
    if (dr.day > m.days) continue;
    const date = `${m.ym}-${pad(dr.day)}`;
    if (date > DEMO_TODAY) continue;
    const documentId = documentFor[m.ym]?.[dr.accountId];
    if (!documentId) throw new Error(`No document for ${m.ym} ${dr.accountId}`);
    all.push({
      accountId: dr.accountId,
      date,
      description: dr.description,
      type: dr.type,
      amountAgorot: dr.amountAgorot,
      ...(dr.original ? { original: dr.original } : {}),
      categoryId: dr.categoryId,
      memberIds: dr.memberIds,
      tagIds: dr.tagIds ?? [],
      ...(dr.status ? { status: dr.status } : {}),
      documentId,
      ...(dr.deletedAt ? { deletedAt: dr.deletedAt } : {}),
    });
  }
}
all.sort((a, b) =>
  a.date === b.date
    ? a.accountId.localeCompare(b.accountId)
    : a.date.localeCompare(b.date),
);
const transactions: Transaction[] = all.map((t, i) => ({
  id: `tx-${String(i + 1).padStart(4, "0")}`,
  ...t,
  history: [],
}));

// Print each month's coverage so the figure in the UI can be checked by hand (demo-data.md).
for (const m of months) {
  const exp = transactions.filter(
    (t) => t.date.startsWith(m.ym) && t.type === "expense" && !t.deletedAt,
  );
  const total = exp.reduce((s, t) => s + t.amountAgorot, 0);
  const covered = exp
    .filter((t) => t.categoryId !== null && !t.status)
    .reduce((s, t) => s + t.amountAgorot, 0);
  const count = transactions.filter((t) => t.date.startsWith(m.ym)).length;
  console.log(
    `${m.ym}: ${count} transactions, expenses ${total}, coverage ${Math.floor((covered * 100) / total)}%`,
  );
}

const out = new URL("../src/demo/transactions.generated.ts", import.meta.url);
writeFileSync(
  out,
  `// Generated by scripts/generate-demo-data.ts (seed ${SEED}). Do not edit by hand.\n` +
    `// Synthetic demo data only (R-006, R-029).\n` +
    `import type { Transaction } from "./types";\n\n` +
    `export const demoTransactions: Transaction[] = ${JSON.stringify(transactions, null, 2)};\n`,
);
console.log(`Wrote ${transactions.length} transactions to ${out.pathname}`);
