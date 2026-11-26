/**
 * In-memory household state and the pure operations on it. Everything resets on reload
 * (prototype only). Operations return new objects and never mutate their input.
 */
import { doc006Rows, demoDocuments } from "../demo/documents";
import { demoFutureItems } from "../demo/future-items";
import {
  demoAccounts,
  demoCoverage,
  demoHousehold,
  demoMembers,
  demoTags,
  demoUsers,
} from "../demo/household";
import { demoTransactions } from "../demo/transactions.generated";
import type {
  Account,
  AccountCoverage,
  FutureItem,
  Household,
  IsoDate,
  IsoDateTime,
  Member,
  ReviewRow,
  Tag,
  Transaction,
  UploadDocument,
  User,
} from "../demo/types";

export interface HouseholdData {
  household: Household;
  members: Member[];
  users: User[];
  tags: Tag[];
  accounts: Account[];
  coverage: AccountCoverage[];
  transactions: Transaction[];
  documents: UploadDocument[];
  /** Review rows per document; only documents that went through extraction have them. */
  reviews: Record<string, ReviewRow[]>;
  futureItems: FutureItem[];
}

export function createDemoHousehold(): HouseholdData {
  return structuredClone({
    household: demoHousehold,
    members: demoMembers,
    users: demoUsers,
    tags: demoTags,
    accounts: demoAccounts,
    coverage: demoCoverage,
    transactions: demoTransactions,
    documents: demoDocuments,
    reviews: { "doc-006": doc006Rows() },
    futureItems: demoFutureItems,
  });
}

/** A new, empty household created by the setup wizard. Same account set as the demo. */
export function createEmptyHousehold(
  id: string,
  name: string,
  members: Member[],
  users: User[],
): HouseholdData {
  return {
    household: { id, name },
    members,
    users,
    tags: [],
    accounts: structuredClone(demoAccounts),
    coverage: [],
    transactions: [],
    documents: [],
    reviews: {},
    futureItems: [],
  };
}

// --- Transactions ------------------------------------------------------------------------------

type EditableField =
  | "categoryId"
  | "memberIds"
  | "tagIds"
  | "type"
  | "description"
  | "date"
  | "amountAgorot";
export type TransactionPatch = Partial<Pick<Transaction, EditableField>>;

const show = (v: unknown): string =>
  Array.isArray(v) ? v.join(", ") : v === null ? "—" : String(v);

/** Applies a patch and appends one history entry per changed field (never overwrite silently). */
export function patchTransaction(
  t: Transaction,
  patch: TransactionPatch,
  by: string,
  at: IsoDateTime,
): Transaction {
  const history = [...t.history];
  const next: Transaction = { ...t };
  for (const key of Object.keys(patch) as EditableField[]) {
    const to = patch[key];
    if (to === undefined) continue;
    const from = t[key];
    if (JSON.stringify(from) === JSON.stringify(to)) continue;
    history.push({ at, by, field: key, from: show(from), to: show(to) });
    (next as Record<EditableField, unknown>)[key] = to;
  }
  // A transfer has no category (D2).
  if (next.type === "transfer" && next.categoryId !== null)
    next.categoryId = null;
  next.history = history;
  return next;
}

export function updateTransactions(
  data: HouseholdData,
  ids: readonly string[],
  patchFor: (t: Transaction) => TransactionPatch | null,
  by: string,
  at: IsoDateTime,
): HouseholdData {
  const set = new Set(ids);
  return {
    ...data,
    transactions: data.transactions.map((t) => {
      if (!set.has(t.id)) return t;
      const patch = patchFor(t);
      return patch ? patchTransaction(t, patch, by, at) : t;
    }),
  };
}

/** Replaces transactions by id with earlier snapshots (undo). */
export function restoreSnapshots(
  data: HouseholdData,
  snapshots: readonly Transaction[],
): HouseholdData {
  const byId = new Map(snapshots.map((s) => [s.id, s]));
  return {
    ...data,
    transactions: data.transactions.map((t) => byId.get(t.id) ?? t),
  };
}

/** Soft delete (D11): rows are kept with `deletedAt` and can be restored. */
export function deleteTransactions(
  data: HouseholdData,
  ids: readonly string[],
  today: IsoDate,
): HouseholdData {
  const set = new Set(ids);
  return {
    ...data,
    transactions: data.transactions.map((t) =>
      set.has(t.id) ? { ...t, deletedAt: today } : t,
    ),
  };
}

export function restoreTransactions(
  data: HouseholdData,
  ids: readonly string[],
): HouseholdData {
  const set = new Set(ids);
  return {
    ...data,
    transactions: data.transactions.map((t) => {
      if (!set.has(t.id)) return t;
      const { deletedAt: _removed, ...rest } = t;
      return rest;
    }),
  };
}

// --- Review and intake ---------------------------------------------------------------------------

/** The category a review row is imported with: the user's choice, else the suggestion. */
export function reviewCategory(row: ReviewRow): string | null {
  return row.categoryId !== undefined
    ? row.categoryId
    : row.suggestedCategoryId;
}

export type RowState =
  "ready" | "attention" | "unparsed" | "duplicate" | "approved" | "rejected";

/** True when every required field of a row is filled (manual and fixed rows). */
export function rowComplete(row: ReviewRow): boolean {
  const f = row.fields;
  return Boolean(
    f.date &&
    f.description &&
    f.type &&
    f.amountAgorot !== undefined &&
    f.amountAgorot > 0,
  );
}

export function rowState(row: ReviewRow): RowState {
  if (row.decision === "approved") return "approved";
  if (row.decision === "rejected") return "rejected";
  if (row.parseStatus === "unparsed" && !(row.manual && rowComplete(row)))
    return "unparsed";
  if (row.duplicateOf && row.duplicateDecision === undefined)
    return "duplicate";
  if (row.lowConfidence.length > 0 || !rowComplete(row)) return "attention";
  return "ready";
}

/** A row can be approved when nothing blocks it (unparsed, undecided duplicate, missing fields). */
export function canApprove(row: ReviewRow): boolean {
  if (row.decision === "approved") return false;
  if (row.parseStatus === "unparsed" && !(row.manual && rowComplete(row)))
    return false;
  if (row.duplicateOf && row.duplicateDecision === undefined) return false;
  if (row.duplicateDecision === "skip") return false;
  return rowComplete(row);
}

export function setReviewRows(
  data: HouseholdData,
  documentId: string,
  update: (rows: ReviewRow[]) => ReviewRow[],
): HouseholdData {
  return {
    ...data,
    reviews: {
      ...data.reviews,
      [documentId]: update(data.reviews[documentId] ?? []),
    },
  };
}

export interface IntakeCounts {
  imported: number;
  rejected: number;
  skippedDuplicates: number;
}

export function intakeCounts(rows: readonly ReviewRow[]): IntakeCounts {
  let imported = 0;
  let rejected = 0;
  let skippedDuplicates = 0;
  for (const r of rows) {
    if (r.duplicateDecision === "skip") skippedDuplicates += 1;
    else if (r.decision === "approved") imported += 1;
    else if (r.decision === "rejected") rejected += 1;
  }
  return { imported, rejected, skippedDuplicates };
}

/**
 * "סיום וקליטה": moves approved rows into the transactions collection as one atomic step (R-008),
 * extends the account's data coverage and sets the document's final status.
 */
export function commitIntake(
  data: HouseholdData,
  documentId: string,
): HouseholdData {
  const doc = data.documents.find((d) => d.id === documentId);
  const rows = data.reviews[documentId] ?? [];
  if (!doc) throw new Error("Unknown document");
  if (rows.some((r) => r.decision === "pending"))
    throw new Error("Every row needs a decision");
  const accountId = doc.detected?.accountIds[0] ?? "acc-b";
  const approved = rows.filter(
    (r) => r.decision === "approved" && r.duplicateDecision !== "skip",
  );
  const start = data.transactions.length;
  const created: Transaction[] = approved.map((r, i) => {
    const f = r.fields;
    const type = f.type ?? "expense";
    return {
      id: `tx-${documentId}-${String(start + i + 1).padStart(4, "0")}`,
      accountId,
      date: f.date ?? doc.uploadedAt.slice(0, 10),
      description: f.description ?? "",
      type,
      amountAgorot: f.amountAgorot ?? 0,
      ...(f.original ? { original: f.original } : {}),
      categoryId: type === "transfer" ? null : reviewCategory(r),
      memberIds: r.memberIds,
      tagIds: r.tagIds,
      ...(r.status ? { status: r.status } : {}),
      documentId,
      history: [],
    };
  });
  const dates = created.map((t) => t.date).toSorted();
  const coverageTo = doc.detected?.to ?? dates[dates.length - 1];
  const coverageFrom = doc.detected?.from ?? dates[0];
  let coverage = data.coverage;
  if (created.length > 0 && coverageTo && coverageFrom) {
    const existing = coverage.find((c) => c.accountId === accountId);
    coverage = existing
      ? coverage.map((c) =>
          c.accountId === accountId
            ? {
                ...c,
                from: coverageFrom < c.from ? coverageFrom : c.from,
                to: coverageTo > c.to ? coverageTo : c.to,
              }
            : c,
        )
      : [...coverage, { accountId, from: coverageFrom, to: coverageTo }];
  }
  const total = rows.length;
  const status: UploadDocument["status"] =
    created.length === 0
      ? "rejected"
      : created.length === total
        ? "approved"
        : "partially-approved";
  return {
    ...data,
    transactions: [...data.transactions, ...created],
    coverage,
    documents: data.documents.map((d) =>
      d.id === documentId
        ? { ...d, status, approvedCount: created.length, totalRows: total }
        : d,
    ),
  };
}

export function rejectDocument(
  data: HouseholdData,
  documentId: string,
): HouseholdData {
  return {
    ...data,
    documents: data.documents.map((d) =>
      d.id === documentId ? { ...d, status: "rejected", approvedCount: 0 } : d,
    ),
  };
}

// --- Future items (preview layer) -------------------------------------------------------------

/**
 * "שמירת השינוי" (R-010): the new value applies from this item's month onward, to this item and
 * later items with the same description; every changed item keeps its previous value in history.
 */
export function saveFutureAmount(
  data: HouseholdData,
  itemId: string,
  amountAgorot: number,
  by: string,
  at: IsoDateTime,
): HouseholdData {
  const item = data.futureItems.find((f) => f.id === itemId);
  if (!item) return data;
  const effectiveFrom = `${item.date.slice(0, 7)}-01`;
  return {
    ...data,
    futureItems: data.futureItems.map((f) => {
      const applies =
        f.id === itemId ||
        (f.description === item.description && f.date > item.date);
      if (!applies || f.amountAgorot === amountAgorot) return f;
      return {
        ...f,
        amountAgorot,
        history: [
          ...f.history,
          { effectiveFrom, from: f.amountAgorot, to: amountAgorot, at, by },
        ],
      };
    }),
  };
}

export function setTemporaryEstimate(
  data: HouseholdData,
  itemId: string,
  amountAgorot: number | null,
): HouseholdData {
  return {
    ...data,
    futureItems: data.futureItems.map((f) => {
      if (f.id !== itemId) return f;
      if (amountAgorot === null) {
        const { temporaryEstimate: _removed, ...rest } = f;
        return rest;
      }
      return { ...f, temporaryEstimate: { amountAgorot } };
    }),
  };
}

/** The amount shown for a future item: the temporary estimate wins while it exists. */
export function futureAmount(f: FutureItem): number {
  return f.temporaryEstimate?.amountAgorot ?? f.amountAgorot;
}

/** Certainty shown: a temporary estimate is always marked as an estimate. */
export function futureCertainty(f: FutureItem): FutureItem["certainty"] {
  return f.temporaryEstimate ? "estimate" : f.certainty;
}

// --- Household -----------------------------------------------------------------------------------

/** Removes a member and strips their assignment from transactions (they stay, without it). */
export function removeMember(
  data: HouseholdData,
  memberId: string,
): HouseholdData {
  return {
    ...data,
    members: data.members.filter((m) => m.id !== memberId),
    transactions: data.transactions.map((t) =>
      t.memberIds.includes(memberId)
        ? { ...t, memberIds: t.memberIds.filter((m) => m !== memberId) }
        : t,
    ),
  };
}

export function deleteTag(data: HouseholdData, tagId: string): HouseholdData {
  return {
    ...data,
    tags: data.tags.filter((t) => t.id !== tagId),
    transactions: data.transactions.map((t) =>
      t.tagIds.includes(tagId)
        ? { ...t, tagIds: t.tagIds.filter((x) => x !== tagId) }
        : t,
    ),
  };
}

let idCounter = 0;
/** Prototype ids; the real app uses UUIDs. */
export function newId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${idCounter}`;
}
