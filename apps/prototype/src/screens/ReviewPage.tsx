/**
 * Review before intake (upload-and-review.md). Nothing enters the household's data before
 * "סיום וקליטה", which commits all approved rows in one step (R-008).
 */
import {
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import { PageHeader } from "../components/AppShell";
import { EmptyState, useToast } from "../components/feedback";
import { Icon } from "../components/Icon";
import { Modal, Popover } from "../components/overlays";
import {
  CategoryPicker,
  categoryLabel,
  MemberTagPicker,
} from "../components/pickers";
import {
  Amount,
  Chip,
  ConfidenceMark,
  DateCell,
} from "../components/primitives";
import { AssignmentChips } from "../components/TransactionTable";
import { getCategory } from "../demo/categories";
import type { ReviewField, ReviewRow, TxType } from "../demo/types";
import {
  amountToInput,
  formatAmount,
  formatDate,
  formatOriginal,
  parseAmountInput,
  t,
} from "../lib/format";
import { Link, navigate } from "../lib/router";
import { PHONE_QUERY, useMediaQuery } from "../lib/useMediaQuery";
import { he } from "../locale/he";
import {
  canApprove,
  commitIntake,
  intakeCounts,
  newId,
  rejectDocument,
  rowComplete,
  type RowState,
  rowState,
  setReviewRows,
} from "../state/household-data";
import { useCurrent } from "../state/store";
import { detectedLabel, useManualEntry } from "./UploadPage";

type Tab = "all" | "attention" | "unparsed" | "duplicates";
const TYPES: TxType[] = ["expense", "income", "transfer"];

const stateBadge: Record<RowState, string> = {
  ready: "badge--neutral",
  attention: "badge--low-confidence",
  unparsed: "badge--unparsed",
  duplicate: "badge--expected",
  approved: "badge--income",
  rejected: "badge--neutral",
};

function AmountInput({
  value,
  onCommit,
  label,
  invalid,
}: {
  value: number | undefined;
  onCommit: (agorot: number | undefined) => void;
  label: string;
  invalid?: boolean;
}) {
  const [text, setText] = useState(
    value === undefined ? "" : amountToInput(value),
  );
  useEffect(
    () => setText(value === undefined ? "" : amountToInput(value)),
    [value],
  );
  return (
    <input
      type="text"
      inputMode="decimal"
      dir="ltr"
      className="cell-input cell-input--amount"
      aria-label={label}
      aria-invalid={invalid}
      placeholder={he.review.amountPlaceholder}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const parsed = parseAmountInput(text);
        onCommit(parsed === null ? value : parsed);
        if (parsed === null)
          setText(value === undefined ? "" : amountToInput(value));
      }}
    />
  );
}

export function ReviewPage({ documentId }: { documentId: string }) {
  const { data, can, update } = useCurrent();
  const toast = useToast();
  const isPhone = useMediaQuery(PHONE_QUERY);
  const manualEntry = useManualEntry();
  const doc = data.documents.find((d) => d.id === documentId);
  const rows = data.reviews[documentId] ?? [];
  const [tab, setTab] = useState<Tab>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [intaking, setIntaking] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [rejectDoc, setRejectDoc] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const [openPicker, setOpenPicker] = useState<{
    row: string;
    kind: "category" | "members";
  } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const finished = useRef(false);
  const touched = useRef(false);

  const readOnly = !can("approve") || doc?.status !== "awaiting-review";

  // Leaving with decisions but without intake keeps them as a draft.
  useEffect(
    () => () => {
      if (touched.current && !finished.current)
        toast.show(he.review.draftSaved);
    },
    [toast],
  );

  if (!doc) {
    return (
      <div className="page">
        <PageHeader title={he.review.title} />
        <EmptyState
          icon="file"
          title={he.review.notFound}
          action={
            <Link to="/upload" className="btn btn--primary">
              {he.review.backToUpload}
            </Link>
          }
        />
      </div>
    );
  }

  const updateRows = (fn: (rows: ReviewRow[]) => ReviewRow[]) => {
    touched.current = true;
    update((d) => setReviewRows(d, documentId, fn));
  };
  const patchRow = (id: string, fn: (r: ReviewRow) => ReviewRow) =>
    updateRows((rs) => rs.map((r) => (r.id === id ? fn(r) : r)));
  const editField = (
    id: string,
    field: ReviewField,
    patch: Partial<ReviewRow["fields"]>,
  ) =>
    patchRow(id, (r) => ({
      ...r,
      fields: { ...r.fields, ...patch },
      lowConfidence: r.lowConfidence.filter((f) => f !== field),
    }));
  const confirmField = (id: string, field: ReviewField) =>
    patchRow(id, (r) => ({
      ...r,
      lowConfidence: r.lowConfidence.filter((f) => f !== field),
      ...(field === "category" ? { categoryConfirmed: true } : {}),
    }));

  const states = rows.map((r) => ({ row: r, state: rowState(r) }));
  const count = (s: RowState) => states.filter((x) => x.state === s).length;
  const lowConf = rows.filter(
    (r) => r.lowConfidence.length > 0 && r.parseStatus === "parsed",
  ).length;
  const dupCount = rows.filter((r) => r.duplicateOf).length;
  const unparsedCount = rows.filter((r) => r.parseStatus === "unparsed").length;
  const visible = states.filter(({ row, state }) =>
    tab === "all"
      ? true
      : tab === "attention"
        ? state === "attention" || state === "unparsed" || state === "duplicate"
        : tab === "unparsed"
          ? row.parseStatus === "unparsed"
          : Boolean(row.duplicateOf),
  );
  const readyIds = states
    .filter((x) => x.state === "ready")
    .map((x) => x.row.id);
  const allDecided =
    rows.length > 0 && rows.every((r) => r.decision !== "pending");
  const counts = intakeCounts(rows);
  const index = (id: string) => rows.findIndex((r) => r.id === id) + 1;

  const decide = (
    ids: readonly string[],
    decision: "approved" | "rejected",
  ) => {
    const blocked =
      decision === "approved"
        ? rows.filter(
            (r) =>
              ids.includes(r.id) && r.decision !== "approved" && !canApprove(r),
          ).length
        : 0;
    updateRows((rs) =>
      rs.map((r) => {
        if (!ids.includes(r.id)) return r;
        if (decision === "approved" && !canApprove(r)) return r;
        return {
          ...r,
          decision,
          ...(decision === "approved"
            ? { lowConfidence: [], categoryConfirmed: true }
            : {}),
        };
      }),
    );
    if (blocked > 0) toast.show(t(he.review.needsAttention, { n: blocked }));
    setSelected(new Set());
  };
  const undoDecision = (id: string) =>
    patchRow(id, (r) => ({ ...r, decision: "pending" }));
  const focusNext = (fromId: string) => {
    const i = rows.findIndex((r) => r.id === fromId);
    const next = rows.slice(i + 1).find((r) => r.decision === "pending");
    if (next)
      setTimeout(
        () =>
          tableRef.current
            ?.querySelector<HTMLElement>(`[data-row="${next.id}"]`)
            ?.focus(),
        0,
      );
  };
  const onRowKey = (e: KeyboardEvent<HTMLElement>, r: ReviewRow) => {
    if (e.target !== e.currentTarget || readOnly) return;
    const key = e.key.toLowerCase();
    if (key === "a" && canApprove(r)) {
      decide([r.id], "approved");
      focusNext(r.id);
    } else if (key === "r") {
      decide([r.id], "rejected");
      focusNext(r.id);
    } else if (key === " ") {
      e.preventDefault();
      toggleSel(r.id);
    } else if (key === "j" || key === "k") {
      const order = key === "j" ? rows : [...rows].reverse();
      const i = order.findIndex((x) => x.id === r.id);
      const target = order
        .slice(i + 1)
        .find((x) =>
          ["attention", "unparsed", "duplicate"].includes(rowState(x)),
        );
      if (target)
        tableRef.current
          ?.querySelector<HTMLElement>(`[data-row="${target.id}"]`)
          ?.focus();
    }
  };
  const toggleSel = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const addRow = () => {
    const id = newId("row");
    updateRows((rs) => [
      ...rs,
      {
        id,
        parseStatus: "parsed",
        manual: true,
        fields: { type: "expense", currency: "ILS" },
        suggestedCategoryId: null,
        categoryConfirmed: true,
        memberIds: [],
        tagIds: [],
        lowConfidence: [],
        decision: "pending",
      },
    ]);
  };
  const intake = () => {
    setIntaking(true);
    setTimeout(() => {
      finished.current = true;
      update((d) => commitIntake(d, documentId));
      toast.show(
        t(he.review.intakeDone, { a: counts.imported, file: doc.fileName }),
      );
      navigate(`/transactions?document=${documentId}`);
    }, 400);
  };

  // --- cell renderers (shared by table and phone cards) ---
  const lc = (r: ReviewRow, f: ReviewField) => r.lowConfidence.includes(f);
  const editableRow = (r: ReviewRow) =>
    !readOnly &&
    r.decision !== "rejected" &&
    (r.parseStatus === "parsed" || r.manual === true);
  const n = (r: ReviewRow) => index(r.id);

  const dateCell = (r: ReviewRow) =>
    editableRow(r) ? (
      <ConfidenceMark
        active={lc(r, "date")}
        onConfirm={() => confirmField(r.id, "date")}
      >
        <input
          type="date"
          className="cell-input"
          aria-label={`${he.table.date} · ${t(he.review.rowLabel, { n: n(r) })}`}
          value={r.fields.date ?? ""}
          onChange={(e) => editField(r.id, "date", { date: e.target.value })}
        />
      </ConfidenceMark>
    ) : r.fields.date ? (
      <DateCell date={r.fields.date} />
    ) : (
      <span className="muted">{he.common.none}</span>
    );
  const descCell = (r: ReviewRow) =>
    editableRow(r) ? (
      <ConfidenceMark
        active={lc(r, "description")}
        onConfirm={() => confirmField(r.id, "description")}
      >
        <input
          type="text"
          className={`cell-input ${r.decision === "rejected" ? "is-struck" : ""}`}
          aria-label={`${he.table.description} · ${t(he.review.rowLabel, { n: n(r) })}`}
          placeholder={he.review.descriptionPlaceholder}
          value={r.fields.description ?? ""}
          onChange={(e) =>
            editField(r.id, "description", { description: e.target.value })
          }
        />
      </ConfidenceMark>
    ) : (
      <bdi className={r.decision === "rejected" ? "is-struck" : ""}>
        {r.fields.description ?? he.common.none}
      </bdi>
    );
  const typeCell = (r: ReviewRow) =>
    editableRow(r) ? (
      <ConfidenceMark
        active={lc(r, "type")}
        onConfirm={() => confirmField(r.id, "type")}
      >
        <select
          className="cell-input"
          aria-label={`${he.table.type} · ${t(he.review.rowLabel, { n: n(r) })}`}
          value={r.fields.type ?? ""}
          onChange={(e) =>
            patchRow(r.id, (x) => {
              const type = e.target.value as TxType;
              const current = getCategory(x.suggestedCategoryId);
              const keep =
                type !== "transfer" &&
                current !== undefined &&
                current.type === type;
              return {
                ...x,
                fields: { ...x.fields, type },
                suggestedCategoryId: keep ? x.suggestedCategoryId : null,
                lowConfidence: x.lowConfidence.filter(
                  (f) =>
                    f !== "type" && (type !== "transfer" || f !== "category"),
                ),
              };
            })
          }
        >
          {TYPES.map((ty) => (
            <option key={ty} value={ty}>
              {he.types[ty]}
            </option>
          ))}
        </select>
      </ConfidenceMark>
    ) : r.fields.type ? (
      he.types[r.fields.type]
    ) : (
      <span className="muted">{he.common.none}</span>
    );
  const amountCell = (r: ReviewRow) => (
    <div className="review-amount">
      {editableRow(r) ? (
        <ConfidenceMark
          active={lc(r, "amount")}
          onConfirm={() => confirmField(r.id, "amount")}
        >
          <AmountInput
            value={r.fields.amountAgorot}
            label={`${he.table.amount} · ${t(he.review.rowLabel, { n: n(r) })}`}
            invalid={r.manual === true && !r.fields.amountAgorot}
            onCommit={(v) => {
              if (v !== r.fields.amountAgorot)
                editField(r.id, "amount", { amountAgorot: v });
            }}
          />
        </ConfidenceMark>
      ) : r.fields.amountAgorot !== undefined ? (
        <Amount
          agorot={r.fields.amountAgorot}
          {...(r.fields.type ? { type: r.fields.type } : {})}
        />
      ) : (
        <span className="muted">{he.common.none}</span>
      )}
      {r.fields.original ? (
        <span className="amount-original">
          {t(he.table.original, {
            amount: formatOriginal(
              r.fields.original.currency,
              r.fields.original.amountMinor,
            ),
          })}
        </span>
      ) : null}
      {r.parseStatus === "parsed" && r.fields.currency === null ? (
        <span className="amount-original">{he.review.defaultCurrency}</span>
      ) : null}
    </div>
  );
  const categoryCell = (r: ReviewRow) => {
    if (r.status === "card-charge-not-itemized")
      return (
        <span className="badge badge--not-itemized">
          {he.status.notItemized}
        </span>
      );
    if (r.fields.type === "transfer")
      return <span className="muted">{he.picker.transferNoCategory}</span>;
    if (r.parseStatus === "unparsed" && !r.manual)
      return <span className="muted">{he.common.none}</span>;
    const chip = (
      <span className="chips">
        <Chip variant={r.suggestedCategoryId ? "solid" : "dashed"}>
          {categoryLabel(r.suggestedCategoryId)}
        </Chip>
        {r.suggestedCategoryId && !r.categoryConfirmed ? (
          <span className="chip chip--suggestion">{he.picker.suggestion}</span>
        ) : null}
      </span>
    );
    if (!editableRow(r)) return chip;
    const open = openPicker?.row === r.id && openPicker.kind === "category";
    return (
      <ConfidenceMark
        active={lc(r, "category")}
        onConfirm={() => confirmField(r.id, "category")}
      >
        <span className="popover-anchor">
          <button
            type="button"
            className="chip-btn"
            aria-expanded={open}
            aria-label={`${he.table.category}: ${categoryLabel(r.suggestedCategoryId)} · ${t(he.review.rowLabel, { n: n(r) })}`}
            onClick={() =>
              setOpenPicker(open ? null : { row: r.id, kind: "category" })
            }
          >
            {chip}
          </button>
          {open ? (
            <Popover
              label={he.picker.categoryLabel}
              onClose={() => setOpenPicker(null)}
            >
              <CategoryPicker
                type={r.fields.type === "income" ? "income" : "expense"}
                value={r.suggestedCategoryId}
                onChange={(id) => {
                  setOpenPicker(null);
                  patchRow(r.id, (x) => ({
                    ...x,
                    suggestedCategoryId: id,
                    categoryConfirmed: true,
                    lowConfidence: x.lowConfidence.filter(
                      (f) => f !== "category",
                    ),
                  }));
                }}
              />
            </Popover>
          ) : null}
        </span>
      </ConfidenceMark>
    );
  };
  const membersCell = (r: ReviewRow) => {
    if (r.parseStatus === "unparsed" && !r.manual) return null;
    const chips = (
      <AssignmentChips
        memberIds={r.memberIds}
        tagIds={r.tagIds}
        members={data.members}
        tags={data.tags}
      />
    );
    if (!editableRow(r)) return chips;
    const open = openPicker?.row === r.id && openPicker.kind === "members";
    return (
      <span className="popover-anchor">
        <button
          type="button"
          className="chip-btn"
          aria-expanded={open}
          aria-label={`${he.table.assignment} · ${t(he.review.rowLabel, { n: n(r) })}`}
          onClick={() =>
            setOpenPicker(open ? null : { row: r.id, kind: "members" })
          }
        >
          {chips}
        </button>
        {open ? (
          <Popover
            label={he.table.assignment}
            onClose={() => setOpenPicker(null)}
          >
            <MemberTagPicker
              members={data.members}
              tags={data.tags}
              memberIds={r.memberIds}
              tagIds={r.tagIds}
              onChange={(m, tg) =>
                patchRow(r.id, (x) => ({ ...x, memberIds: m, tagIds: tg }))
              }
            />
          </Popover>
        ) : null}
      </span>
    );
  };
  const statusCell = (state: RowState) => (
    <span className={`badge ${stateBadge[state]}`}>
      {state === "approved" ? <Icon name="check" size={14} /> : null}
      {state === "unparsed" ? <Icon name="error" size={14} /> : null}
      {state === "attention" ? <Icon name="warning" size={14} /> : null}
      {state === "duplicate" ? <Icon name="copy" size={14} /> : null}
      {he.review.statuses[state]}
    </span>
  );
  const actionsCell = (r: ReviewRow) => {
    if (readOnly) return null;
    if (r.decision !== "pending") {
      return (
        <button
          type="button"
          className="link-btn link-btn--inline"
          onClick={() => undoDecision(r.id)}
        >
          {he.review.undoDecision}
        </button>
      );
    }
    if (r.parseStatus === "unparsed" && !r.manual) {
      return (
        <span className="row-actions">
          <button
            type="button"
            className="btn btn--secondary btn--sm"
            aria-label={t(he.review.fixRow, { n: n(r) })}
            onClick={() =>
              patchRow(r.id, (x) => ({
                ...x,
                manual: true,
                fields: { ...x.fields, type: "expense", currency: "ILS" },
              }))
            }
          >
            {he.review.fix}
          </button>
          <button
            type="button"
            className="icon-btn"
            aria-label={t(he.review.rejectRow, { n: n(r) })}
            title={he.review.reject}
            onClick={() => decide([r.id], "rejected")}
          >
            <Icon name="close" />
          </button>
        </span>
      );
    }
    return (
      <span className="row-actions">
        <button
          type="button"
          className="icon-btn icon-btn--approve"
          aria-label={t(he.review.approveRow, { n: n(r) })}
          title={he.review.approve}
          disabled={!canApprove(r)}
          onClick={() => {
            decide([r.id], "approved");
            focusNext(r.id);
          }}
        >
          <Icon name="check" />
        </button>
        <button
          type="button"
          className="icon-btn icon-btn--reject"
          aria-label={t(he.review.rejectRow, { n: n(r) })}
          title={he.review.reject}
          onClick={() => decide([r.id], "rejected")}
        >
          <Icon name="close" />
        </button>
      </span>
    );
  };
  const duplicateLine = (r: ReviewRow) => {
    if (!r.duplicateOf) return null;
    const existing = data.transactions.find((x) => x.id === r.duplicateOf);
    if (!existing) return null;
    const account =
      data.accounts.find((a) => a.id === existing.accountId)?.name ?? "";
    return (
      <div className="duplicate-line">
        <Icon name="warning" size={16} />
        <span>
          {t(he.review.duplicateOf, {
            date: formatDate(existing.date),
            description: existing.description,
            amount: formatAmount(existing.amountAgorot, { sign: "none" }),
            account,
          })}
        </span>
        <fieldset
          className="radio-inline"
          disabled={readOnly || r.decision === "approved"}
        >
          <legend className="sr-only">{he.review.duplicateLegend}</legend>
          <label className="radio-row">
            <input
              type="radio"
              name={`dup-${r.id}`}
              checked={r.duplicateDecision === "keep"}
              onChange={() =>
                patchRow(r.id, (x) => ({
                  ...x,
                  duplicateDecision: "keep",
                  decision: x.decision === "rejected" ? "pending" : x.decision,
                }))
              }
            />
            {he.review.keep}
          </label>
          <label className="radio-row">
            <input
              type="radio"
              name={`dup-${r.id}`}
              checked={r.duplicateDecision === "skip"}
              onChange={() =>
                patchRow(r.id, (x) => ({
                  ...x,
                  duplicateDecision: "skip",
                  decision: "rejected",
                }))
              }
            />
            {he.review.skip}
          </label>
        </fieldset>
      </div>
    );
  };
  const rawLine = (r: ReviewRow) =>
    r.parseStatus === "unparsed" && r.raw ? (
      <div className="raw-line">
        <Icon name="error" size={16} />
        <span>{he.review.rawText}</span>
        <bdi className="raw-text">{r.raw}</bdi>
      </div>
    ) : null;
  const rowClass = (r: ReviewRow, state: RowState) =>
    [
      "review-row",
      r.parseStatus === "unparsed" && !(r.manual && rowComplete(r))
        ? "review-row--unparsed"
        : "",
      state === "approved" ? "review-row--approved" : "",
      state === "rejected" ? "review-row--rejected" : "",
      r.status === "card-charge-not-itemized" ? "tx-row--not-itemized" : "",
    ].join(" ");

  const detectedText = doc.detected
    ? t(he.review.detected, {
        kind: he.upload.kinds[doc.detected.kind],
        account: detectedLabel(doc, data).split(" · ")[1] ?? "",
        range: `${formatDate(doc.detected.from)}–${formatDate(doc.detected.to)}`,
      })
    : null;

  const allVisibleSelectable = visible.filter(
    ({ row }) => row.decision === "pending",
  );
  const allSelected =
    allVisibleSelectable.length > 0 &&
    allVisibleSelectable.every(({ row }) => selected.has(row.id));

  let body: ReactNode;
  if (doc.status === "failed") {
    body = (
      <EmptyState
        icon="error"
        title={he.review.failed}
        text={
          doc.failureReason
            ? he.upload.failReasons[doc.failureReason]
            : undefined
        }
        action={
          <button
            type="button"
            className="btn btn--primary"
            onClick={manualEntry}
          >
            {he.upload.manualEntry}
          </button>
        }
        secondary={
          <Link to="/upload" className="btn btn--secondary">
            {he.review.backToUpload}
          </Link>
        }
      />
    );
  } else if (rows.length === 0) {
    body = (
      <EmptyState
        icon="file"
        title={he.review.emptyTitle}
        text={he.review.emptyManual}
        action={
          !readOnly ? (
            <button type="button" className="btn btn--primary" onClick={addRow}>
              {he.review.addRow}
            </button>
          ) : undefined
        }
        secondary={
          <Link to="/upload" className="btn btn--secondary">
            {he.review.backToUpload}
          </Link>
        }
      />
    );
  } else {
    body = (
      <>
        <div className="review-summary">
          <p className="review-summary__text">
            {t(he.review.summary, {
              n: rows.length,
              a: lowConf,
              u: unparsedCount,
              d: dupCount,
            })}
          </p>
          <div
            className="tabs tabs--pills"
            role="tablist"
            aria-label={he.review.tabsLabel}
          >
            {(["all", "attention", "unparsed", "duplicates"] as const).map(
              (k) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={tab === k}
                  className={tab === k ? "is-on" : ""}
                  onClick={() => setTab(k)}
                >
                  {he.review.tabs[k]}
                </button>
              ),
            )}
          </div>
        </div>
        {!readOnly ? (
          <div className="review-tools">
            <button type="button" className="link-btn" onClick={addRow}>
              <Icon name="plus" size={16} />
              {he.review.addRow}
            </button>
          </div>
        ) : null}
        <section className="card card--flush" ref={tableRef}>
          {visible.length === 0 ? (
            <p className="muted card__pad">{he.review.noRows}</p>
          ) : null}
          {isPhone ? (
            <ul className="review-cards">
              {visible.map(({ row: r, state }) => (
                <li
                  key={r.id}
                  className={`review-card ${rowClass(r, state)}`}
                  tabIndex={0}
                  data-row={r.id}
                  onKeyDown={(e) => onRowKey(e, r)}
                >
                  <div className="review-card__top">
                    {!readOnly && r.decision === "pending" ? (
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleSel(r.id)}
                        aria-label={t(he.review.selectRow, { n: n(r) })}
                      />
                    ) : null}
                    <span className="muted">#{n(r)}</span>
                    {statusCell(state)}
                    <span className="spacer" />
                    {actionsCell(r)}
                  </div>
                  {rawLine(r)}
                  {r.parseStatus === "parsed" || r.manual ? (
                    <div className="review-card__fields">
                      <div className="review-card__field review-card__field--wide">
                        {descCell(r)}
                      </div>
                      <div className="review-card__field">{dateCell(r)}</div>
                      <div className="review-card__field">{typeCell(r)}</div>
                      <div className="review-card__field">{amountCell(r)}</div>
                      <div className="review-card__field review-card__field--wide">
                        {categoryCell(r)}
                      </div>
                      <div className="review-card__field review-card__field--wide">
                        {membersCell(r)}
                      </div>
                    </div>
                  ) : null}
                  {duplicateLine(r)}
                </li>
              ))}
            </ul>
          ) : (
            <div className="table-scroll">
              <table className="review-table">
                <colgroup>
                  <col className="rc-check" />
                  <col className="rc-date" />
                  <col />
                  <col className="rc-type" />
                  <col className="rc-amount" />
                  <col className="rc-cat" />
                  <col className="rc-assign" />
                  <col className="rc-status" />
                  <col className="rc-actions" />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col" className="col-check">
                      {!readOnly ? (
                        <input
                          type="checkbox"
                          checked={allSelected}
                          aria-label={he.review.selectAll}
                          onChange={() =>
                            setSelected(
                              allSelected
                                ? new Set()
                                : new Set(
                                    allVisibleSelectable.map(
                                      ({ row }) => row.id,
                                    ),
                                  ),
                            )
                          }
                        />
                      ) : null}
                    </th>
                    <th scope="col">{he.table.date}</th>
                    <th scope="col">{he.table.description}</th>
                    <th scope="col">{he.table.type}</th>
                    <th scope="col">{he.table.amount}</th>
                    <th scope="col">{he.table.category}</th>
                    <th scope="col">{he.table.assignment}</th>
                    <th scope="col">{he.review.status}</th>
                    <th scope="col">
                      <span className="sr-only">{he.table.actions}</span>
                    </th>
                  </tr>
                </thead>
                {visible.map(({ row: r, state }) => {
                  const showFields = r.parseStatus === "parsed" || r.manual;
                  return (
                    <tbody key={r.id} className={rowClass(r, state)}>
                      <tr
                        tabIndex={0}
                        data-row={r.id}
                        onKeyDown={(e) => onRowKey(e, r)}
                        aria-label={t(he.review.rowLabel, { n: n(r) })}
                      >
                        <td className="col-check">
                          {!readOnly && r.decision === "pending" ? (
                            <input
                              type="checkbox"
                              checked={selected.has(r.id)}
                              onChange={() => toggleSel(r.id)}
                              aria-label={t(he.review.selectRow, { n: n(r) })}
                            />
                          ) : null}
                        </td>
                        {showFields ? (
                          <>
                            <td>{dateCell(r)}</td>
                            <td className="col-desc">{descCell(r)}</td>
                            <td>{typeCell(r)}</td>
                            <td className="col-amount">{amountCell(r)}</td>
                            <td>{categoryCell(r)}</td>
                            <td>{membersCell(r)}</td>
                          </>
                        ) : (
                          <td colSpan={6}>{rawLine(r)}</td>
                        )}
                        <td>{statusCell(state)}</td>
                        <td className="col-end">{actionsCell(r)}</td>
                      </tr>
                      {showFields && (r.duplicateOf || (r.manual && r.raw)) ? (
                        <tr className="review-subrow">
                          <td />
                          <td colSpan={8}>
                            {r.manual ? rawLine(r) : null}
                            {duplicateLine(r)}
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  );
                })}
              </table>
            </div>
          )}
        </section>
      </>
    );
  }

  return (
    <div className="page page--with-bar">
      <PageHeader title={he.review.title}>
        <span className="popover-anchor">
          <button
            type="button"
            className="icon-btn"
            aria-label={he.review.shortcuts}
            aria-expanded={shortcuts}
            onClick={() => setShortcuts((s) => !s)}
          >
            <Icon name="keyboard" />
          </button>
          {shortcuts ? (
            <Popover
              label={he.review.shortcuts}
              onClose={() => setShortcuts(false)}
              className="popover--text"
            >
              <p>{he.review.shortcutsList}</p>
            </Popover>
          ) : null}
        </span>
        {!readOnly ? (
          <span className="popover-anchor popover-anchor--end">
            <button
              type="button"
              className="btn btn--ghost"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((o) => !o)}
            >
              <Icon name="more" />
              {he.common.more}
            </button>
            {moreOpen ? (
              <Popover
                label={he.common.more}
                onClose={() => setMoreOpen(false)}
                className="menu"
              >
                <button
                  type="button"
                  className="menu__item menu__item--danger"
                  onClick={() => {
                    setMoreOpen(false);
                    setRejectDoc(true);
                  }}
                >
                  <Icon name="trash" size={16} />
                  {he.review.rejectDocument}
                </button>
              </Popover>
            ) : null}
          </span>
        ) : null}
      </PageHeader>
      <p className="review-file">
        <Icon name="file" size={18} />
        <bdi>{doc.fileName}</bdi>
        {detectedText ? <span className="muted"> · {detectedText}</span> : null}
      </p>
      {readOnly ? (
        <div className="note-bar">
          <Icon name="info" size={18} />
          <strong>{he.review.readOnly}</strong>
          {doc.status !== "awaiting-review" ? (
            <span>{he.review.readOnlyDone}</span>
          ) : null}
        </div>
      ) : null}

      {body}

      {!readOnly && rows.length > 0 ? (
        <div className="action-bar" role="region" aria-label={he.review.title}>
          <span className="action-bar__count">
            {t(he.review.selected, { k: selected.size })}
          </span>
          <div className="action-bar__buttons">
            <button
              type="button"
              className="btn btn--secondary"
              disabled={selected.size === 0}
              onClick={() => decide([...selected], "approved")}
            >
              {he.review.approveSelected}
            </button>
            <button
              type="button"
              className="btn btn--secondary"
              disabled={selected.size === 0}
              onClick={() => decide([...selected], "rejected")}
            >
              {he.review.rejectSelected}
            </button>
            <span className="action-bar__sep" aria-hidden="true" />
            <span className="action-bar__stack">
              <button
                type="button"
                className="btn btn--secondary"
                disabled={readyIds.length === 0}
                onClick={() => decide(readyIds, "approved")}
              >
                {t(he.review.approveReady, { m: readyIds.length })}
              </button>
              <span className="hint">{he.review.approveReadyHint}</span>
            </span>
            <span className="action-bar__stack">
              <button
                type="button"
                className="btn btn--primary"
                disabled={!allDecided}
                onClick={() => setConfirm(true)}
              >
                {he.review.finish}
              </button>
              {!allDecided ? (
                <span className="hint">{he.review.finishHint}</span>
              ) : null}
            </span>
          </div>
        </div>
      ) : null}

      {confirm ? (
        <Modal
          title={he.review.confirmTitle}
          size="sm"
          onClose={() => !intaking && setConfirm(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setConfirm(false)}
                disabled={intaking}
              >
                {he.review.backToReview}
              </button>
              <button
                type="button"
                className="btn btn--primary"
                onClick={intake}
                disabled={intaking}
                data-autofocus
              >
                {intaking ? he.review.intaking : he.review.intake}
              </button>
            </>
          }
        >
          <p>
            {t(he.review.confirmText, {
              a: counts.imported,
              r: counts.rejected,
            })}
          </p>
          {counts.skippedDuplicates > 0 ? (
            <p className="muted">
              {t(he.review.confirmSkipped, { s: counts.skippedDuplicates })}
            </p>
          ) : null}
        </Modal>
      ) : null}

      {rejectDoc ? (
        <Modal
          title={he.review.rejectDocument}
          size="sm"
          onClose={() => setRejectDoc(false)}
          footer={
            <>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setRejectDoc(false)}
              >
                {he.common.cancel}
              </button>
              <button
                type="button"
                className="btn btn--danger"
                onClick={() => {
                  finished.current = true;
                  update((d) => rejectDocument(d, documentId));
                  toast.show(he.review.documentRejected);
                  navigate("/upload");
                }}
              >
                {he.review.rejectDocument}
              </button>
            </>
          }
        >
          <p>{he.review.rejectDocumentConfirm}</p>
        </Modal>
      ) : null}
    </div>
  );
}
