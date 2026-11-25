# Spec corrections and decisions added after the original spec

This document overrides the original spec (spec-original.md) where they conflict.

## A. Decisions made after the spec was written
- ARCH-07, ARCH-08, ARCH-09: see ADR-001 to ADR-008.
- INT-04: Claude is the AI provider (ADR-008). INT-03: no separate OCR provider in the first phase.
- INT-06: authentication with Google (ADR-003).
- The main data source: the bank statement. Credit card details are a separate optional module (ADR-004).
- A user belongs to one household only for now (ADR-002).
- Files per tenant (SQLite) instead of a shared database in the first phase (ADR-001).

## B. Contradictions and gaps found, with a proposal
| Topic | Problem | Proposal | Status |
|---|---|---|---|
| Excel | Section 13 mentions Excel, FR-08 lists only PDF, CSV and images | Add XLSX to FR-08 or decide explicitly not to | Decided 2026-11-23: XLSX supported in v0.1 (section E, D1) |
| Duplication vs multi-tenancy | FR-05 talks about duplicating an installation, ARCH-02 about one system with households | Settled in ADR-001: a tenant is a file, creating a new family is creating a file | Closed |
| Transaction type | FR-60 knows only income and expense, but FR-100 states that a transfer is not an expense | Add a third type "transfer", even if automatic detection comes later | Decided 2026-11-23: third type "transfer", marked by hand in v0.1 (D2) |
| Three certainty taxonomies | Extraction confidence, event status, forecast type | Extraction confidence = a transaction attribute. Status (verified/expected/estimate) = an event attribute. Forecast type = filtering by status. Scenarios = a What-If layer on top of the forecast | Proposed |
| Chart Y axis | Not defined | Liquid balance on the main chart. Net worth as a separate layer (FR-102) | Proposed |
| Duplicate requirements | FR-16 to FR-19 repeat in FR-29 to FR-32. FR-47 duplicates FR-19 | Merge in the renewed spec stage | Proposed |
| Budget dependency | FR-50 and FR-114 depend on a budget module that was deferred | Mark as phase 4 | Proposed |
| Priorities | No priorities at all, so an MVP cannot be planned | Prioritize in stage 1 of the process | Decided 2026-11-23: v0.1 = MVP phase 1; priorities are set per GitHub Issue (D14) |
| [assumption] items | The category lists, the three forecasts and the home-purchase analysis are ChatGPT suggestions, not decisions | Approve or reject item by item | Open |

## C. Spec changes following ADR-004
- A new entity: CardTransaction, separate from Transaction.
- A "credit charge not itemized" status for the row in the bank statement.
- FR-97 to FR-103 and the Dashboard refer to the core module only.
- Three new requirements for the Card Insights module: a soft link to the bank charge, a coverage measure for every category view, and a data completeness measure for every month.

## D. Topics still open
Updated 2026-11-23: the permission matrix, file size and source retention, the duplicate rule, deletion, currency and extraction approval are decided for v0.1 (section E). Still open: notifications, export, regulation and privacy (legal review and hosting region), numeric extraction confidence thresholds, permanent deletion and retention policy, Render pricing and backup storage.

## E. Decisions for v0.1 (owner, 2026-11-23)
| # | Topic | Decision |
|---|---|---|
| D14 | v0.1 scope | v0.1 = MVP phase 1 from process.md: tenancy, Google login, household, document intake (upload, extraction, review, approval), transactions with categories and tags, basic past-data dashboard |
| D1 | File types | PDF, CSV, images and Excel (XLSX). Extends FR-08 |
| D7 | Currency | All currencies. A row with no currency indication defaults to ILS. Totals are in ILS, using the amount the bank actually charged; the original currency and amount are kept and shown |
| D9 | Members and users | Only people who use the app sign in. Other members (for example children) are labels for tagging, with no login |
| D2 | Transaction type | Income, expense and transfer. Transfers are marked by hand in v0.1 and are excluded from income and expense totals. Automatic detection comes later |
| D3 | Permissions (FR-06, v0.1) | Admin: everything, including inviting and removing users. Partner: view, upload, approve and edit, but not manage users. Limited: view only |
| D4 | Approval (FR-20, FR-24) | Every extracted row needs user approval in v0.1. Low-confidence fields are highlighted. Numeric thresholds are set later from the test set |
| D5 | Unreadable documents (FR-26) | Shown as failed with a plain reason, kept in upload history, nothing imported. The user can retry or enter rows by hand |
| D6 | Duplicates (FR-11) | Same file content: warning before extraction. Same date, amount, direction and description: flagged as a possible duplicate for the user to decide. Nothing is deleted automatically |
| D8 | Default categories | The draft category list in spec-original is the editable default for new households |
| D10 | File limits | 10 MB per file. The original is kept in the household's own folder until a retention policy is decided |
| D11 | Deleting a transaction | Recoverable delete (hidden, with undo). Permanent deletion is decided later |
| D12 | First dashboard chart | Monthly income vs expense bars for past months. A balance line comes later |
| D13 | Category suggestion | Extraction suggests a category per row, and the user confirms or changes it on the review screen. No learning from corrections in v0.1 |
| D16 | Test statements | The owner supplies the examples. They must be synthetic or fully redacted, because the repo is public |
| D17 | Requirement priorities | No per-requirement priority labels in v0.1. Everything in the v0.1 scope (D14) is Must. Priorities are revisited when v0.2 is planned |
| D15 | Hosting cost and backup storage | Open. Devops presents prices before Staging and backups are built (ADR-009) |
