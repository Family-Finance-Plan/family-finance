/**
 * Domain types of the prototype's demo data (docs/ux/demo-data.md).
 * Amounts are integers in minor units (agorot for ILS, R-001). Dates are ISO strings.
 */

export type IsoDate = string; // 'YYYY-MM-DD'
export type IsoDateTime = string; // 'YYYY-MM-DDTHH:mm'

export type TxType = "income" | "expense" | "transfer";
export type Role = "admin" | "partner" | "limited";
export type Certainty = "verified" | "expected" | "estimate";

export interface Household {
  id: string;
  name: string;
}

export interface Member {
  id: string;
  name: string;
  kind: "family" | "person";
  color: string;
  userId?: string;
}

export interface User {
  id: string;
  displayName: string;
  email: string;
  role: Role;
  status: "active" | "invited";
  invitedAt?: IsoDate;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Account {
  id: string;
  name: string;
  kind: "bank" | "card";
  currency?: string;
  chargedTo?: string;
  itemized?: boolean;
}

/** Data coverage per bank account (drives CompletenessNote and CoverageNote). */
export interface AccountCoverage {
  accountId: string;
  from: IsoDate;
  to: IsoDate;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  /** Parent id for subcategories; undefined for top-level expense groups and income categories. */
  parentId?: string;
}

export interface OriginalAmount {
  currency: string;
  amountMinor: number;
}

export interface HistoryEntry {
  at: IsoDateTime;
  by: string;
  field: string;
  from: string;
  to: string;
}

export interface Transaction {
  id: string;
  accountId: string;
  date: IsoDate;
  description: string;
  type: TxType;
  /** Positive integer, ILS charged. The direction comes from `type`. */
  amountAgorot: number;
  original?: OriginalAmount;
  /** Subcategory id (or income category id), or null when uncategorized. */
  categoryId: string | null;
  memberIds: string[];
  tagIds: string[];
  status?: "card-charge-not-itemized";
  documentId: string;
  deletedAt?: IsoDate;
  history: HistoryEntry[];
}

export type DocumentStatus =
  "awaiting-review" | "approved" | "partially-approved" | "rejected" | "failed";

export type FailureReason =
  "low-quality-scan" | "password-protected" | "no-transactions";

export interface UploadDocument {
  id: string;
  fileName: string;
  sizeBytes: number;
  uploadedAt: IsoDateTime;
  uploadedBy: string;
  detected?: {
    kind: "bank-statement" | "card-statement";
    accountIds: string[];
    from: IsoDate;
    to: IsoDate;
  };
  status: DocumentStatus;
  failureReason?: FailureReason;
  approvedCount?: number;
  totalRows?: number;
}

export type ReviewField =
  "date" | "description" | "type" | "amount" | "category";

export interface ReviewRow {
  id: string;
  parseStatus: "parsed" | "unparsed";
  raw?: string;
  fields: {
    date?: IsoDate;
    description?: string;
    type?: TxType;
    amountAgorot?: number;
    /** null = no currency in the source; ILS is assumed (D7). */
    currency?: string | null;
    original?: OriginalAmount;
  };
  suggestedCategoryId: string | null;
  /** True once the user touched or confirmed the suggested category (D13). */
  categoryConfirmed?: boolean;
  memberIds: string[];
  tagIds: string[];
  lowConfidence: ReviewField[];
  duplicateOf?: string;
  status?: "card-charge-not-itemized";
  decision: "pending" | "approved" | "rejected";
  duplicateDecision?: "keep" | "skip";
  /** Unparsed row switched to manual fix mode, or a row added by hand. */
  manual?: boolean;
}

export interface FutureItem {
  id: string;
  date: IsoDate;
  description: string;
  type: "income" | "expense";
  amountAgorot: number;
  /** Required, never mixed (R-009). */
  certainty: Certainty;
  categoryId: string | null;
  memberIds: string[];
  temporaryEstimate?: { amountAgorot: number };
  history: {
    effectiveFrom: IsoDate;
    from: number;
    to: number;
    at: IsoDateTime;
    by: string;
  }[];
}
