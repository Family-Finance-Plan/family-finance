/** One window for every edit of a transaction (transactions.md TransactionEditDrawer). */
import { useState } from "react";
import type { Transaction, TxType } from "../demo/types";
import {
  amountToInput,
  formatAmount,
  formatDate,
  formatDateTime,
  formatOriginal,
  parseAmountInput,
  t,
} from "../lib/format";
import { Link } from "../lib/router";
import { isCardCharge } from "../lib/selectors";
import { he } from "../locale/he";
import { useCurrent } from "../state/store";
import { useTransactionActions } from "../state/useTransactionActions";
import { Drawer } from "./overlays";
import { CategoryPicker, categoryLabel, MemberTagPicker } from "./pickers";
import { Amount, NotItemizedBadge } from "./primitives";

const TYPES: TxType[] = ["income", "expense", "transfer"];

export function TransactionEditDrawer({
  tx,
  onClose,
  onSaved,
}: {
  tx: Transaction;
  onClose: () => void;
  onSaved?: (id: string) => void;
}) {
  const { data, can } = useCurrent();
  const { patch, remove, createTag, recentCategories } =
    useTransactionActions();
  const editable = can("editTransactions") && !tx.deletedAt;
  const [draft, setDraft] = useState({
    categoryId: tx.categoryId,
    memberIds: tx.memberIds,
    tagIds: tx.tagIds,
    type: tx.type,
    description: tx.description,
    date: tx.date,
    amount: amountToInput(tx.amountAgorot),
  });
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [amountError, setAmountError] = useState(false);
  const parsedAmount = parseAmountInput(draft.amount);
  const dirty =
    draft.categoryId !== tx.categoryId ||
    JSON.stringify(draft.memberIds) !== JSON.stringify(tx.memberIds) ||
    JSON.stringify(draft.tagIds) !== JSON.stringify(tx.tagIds) ||
    draft.type !== tx.type ||
    draft.description !== tx.description ||
    draft.date !== tx.date ||
    parsedAmount !== tx.amountAgorot;

  const requestClose = () => {
    if (editable && dirty) setConfirmDiscard(true);
    else onClose();
  };
  const save = () => {
    if (parsedAmount === null || parsedAmount === 0) {
      setAmountError(true);
      return;
    }
    patch(
      [tx.id],
      () => ({
        categoryId: draft.type === "transfer" ? null : draft.categoryId,
        memberIds: draft.memberIds,
        tagIds: draft.tagIds,
        type: draft.type,
        description: draft.description.trim() || tx.description,
        date: draft.date || tx.date,
        amountAgorot: parsedAmount,
      }),
      he.transactions.saved,
    );
    onSaved?.(tx.id);
    onClose();
  };
  const account = data.accounts.find((a) => a.id === tx.accountId);
  const doc = data.documents.find((d) => d.id === tx.documentId);
  const card = isCardCharge(tx);
  const fieldLabel = (f: string) =>
    (he.drawer.fields as Record<string, string>)[f] ?? f;
  const showValue = (field: string, value: string): string => {
    if (value === "—") return value;
    if (field === "categoryId") return categoryLabel(value);
    if (field === "type") return he.types[value as TxType] ?? value;
    if (field === "amountAgorot")
      return formatAmount(Number(value), { sign: "none" });
    if (field === "date") return formatDate(value);
    if (field === "memberIds" || field === "tagIds") {
      if (!value) return he.common.none;
      const list: { id: string; name: string }[] =
        field === "memberIds" ? data.members : data.tags;
      return value
        .split(", ")
        .map((id) => list.find((x) => x.id === id)?.name ?? id)
        .join(", ");
    }
    return value;
  };

  const footer = editable ? (
    confirmDiscard ? (
      <div className="inline-confirm" role="alert">
        <span>{he.drawer.discardQuestion}</span>
        <button
          type="button"
          className="btn btn--danger-text"
          onClick={onClose}
        >
          {he.drawer.discard}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={() => setConfirmDiscard(false)}
        >
          {he.drawer.keepEditing}
        </button>
      </div>
    ) : (
      <div className="drawer__actions">
        <button
          type="button"
          className="btn btn--danger-text"
          onClick={() => {
            remove([tx.id]);
            onClose();
          }}
        >
          {he.common.delete}
        </button>
        <span className="spacer" />
        <button
          type="button"
          className="btn btn--secondary"
          onClick={requestClose}
        >
          {he.common.cancel}
        </button>
        <button type="button" className="btn btn--primary" onClick={save}>
          {he.common.save}
        </button>
      </div>
    )
  ) : (
    <div className="drawer__actions">
      <span className="spacer" />
      <button type="button" className="btn btn--secondary" onClick={onClose}>
        {he.common.close}
      </button>
    </div>
  );

  return (
    <Drawer
      title={editable ? he.drawer.title : he.drawer.viewTitle}
      onClose={requestClose}
      footer={footer}
    >
      <div className="drawer__summary">
        <bdi className="drawer__desc">{tx.description}</bdi>
        <Amount
          agorot={tx.amountAgorot}
          type={tx.type}
          {...(tx.original ? { original: tx.original } : {})}
        />
      </div>

      <section className="field-block">
        <h3 className="field-label">{he.drawer.category}</h3>
        {card ? (
          <NotItemizedBadge />
        ) : draft.type === "transfer" ? (
          <p className="muted">{he.picker.transferNoCategory}</p>
        ) : editable ? (
          <>
            <p className="field-current">{categoryLabel(draft.categoryId)}</p>
            <CategoryPicker
              type={draft.type === "income" ? "income" : "expense"}
              value={draft.categoryId}
              recent={recentCategories}
              autoFocus={false}
              onChange={(id) => setDraft((d) => ({ ...d, categoryId: id }))}
            />
          </>
        ) : (
          <p>{categoryLabel(tx.categoryId)}</p>
        )}
      </section>

      <section className="field-block">
        <h3 className="field-label">{he.drawer.members}</h3>
        {editable ? (
          <div
            className="toggle-chips"
            role="group"
            aria-label={he.drawer.members}
          >
            {data.members.map((m) => {
              const on = draft.memberIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  className={`toggle-chip ${on ? "is-on" : ""}`}
                  aria-pressed={on}
                  onClick={() =>
                    setDraft((d) => ({
                      ...d,
                      memberIds: on
                        ? d.memberIds.filter((x) => x !== m.id)
                        : [...d.memberIds, m.id],
                    }))
                  }
                >
                  <span
                    className="chip__dot"
                    style={{ backgroundColor: m.color }}
                    aria-hidden="true"
                  />
                  {m.name}
                </button>
              );
            })}
          </div>
        ) : (
          <p>
            {tx.memberIds
              .map((id) => data.members.find((m) => m.id === id)?.name)
              .filter(Boolean)
              .join(", ") || he.common.none}
          </p>
        )}
      </section>

      <section className="field-block">
        <h3 className="field-label">{he.drawer.tags}</h3>
        {editable ? (
          <MemberTagPicker
            members={[]}
            tags={data.tags}
            memberIds={draft.memberIds}
            tagIds={draft.tagIds}
            autoFocus={false}
            onChange={(_, tagIds) => setDraft((d) => ({ ...d, tagIds }))}
            onCreateTag={createTag}
          />
        ) : (
          <p>
            {tx.tagIds
              .map((id) => data.tags.find((x) => x.id === id)?.name)
              .filter(Boolean)
              .join(", ") || he.common.none}
          </p>
        )}
      </section>

      <fieldset className="field-block" disabled={!editable}>
        <legend className="field-label">{he.drawer.type}</legend>
        <div className="radio-inline">
          {TYPES.map((ty) => (
            <label key={ty} className="radio-row">
              <input
                type="radio"
                name="tx-type"
                checked={draft.type === ty}
                onChange={() => setDraft((d) => ({ ...d, type: ty }))}
                disabled={card}
              />
              {he.types[ty]}
            </label>
          ))}
        </div>
        {draft.type === "transfer" ? (
          <p className="hint">{he.drawer.transferHint}</p>
        ) : null}
      </fieldset>

      <div className="field-grid">
        <label className="field">
          <span className="field-label">{he.drawer.description}</span>
          <input
            type="text"
            value={draft.description}
            readOnly={!editable}
            onChange={(e) =>
              setDraft((d) => ({ ...d, description: e.target.value }))
            }
          />
        </label>
        <label className="field">
          <span className="field-label">{he.drawer.date}</span>
          <input
            type="date"
            value={draft.date}
            readOnly={!editable}
            onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
          />
        </label>
        <label className="field">
          <span className="field-label">{he.drawer.amount}</span>
          <input
            type="text"
            inputMode="decimal"
            dir="ltr"
            value={draft.amount}
            readOnly={!editable}
            aria-invalid={amountError}
            onChange={(e) => {
              setAmountError(false);
              setDraft((d) => ({ ...d, amount: e.target.value }));
            }}
          />
          {amountError ? (
            <span className="field-error">{he.drawer.invalidAmount}</span>
          ) : null}
          {tx.original ? (
            <span className="hint">
              {he.drawer.original}:{" "}
              <bdi>
                {formatOriginal(tx.original.currency, tx.original.amountMinor)}
              </bdi>
            </span>
          ) : null}
        </label>
      </div>

      <section className="field-block">
        <h3 className="field-label">{he.drawer.source}</h3>
        <p className="muted">
          {t(he.drawer.sourceLine, {
            account: account?.name ?? tx.accountId,
            file: doc?.fileName ?? tx.documentId,
            date: doc ? formatDate(doc.uploadedAt.slice(0, 10)) : "",
          })}{" "}
          <Link to="/upload">{he.upload.historyTitle}</Link>
        </p>
      </section>

      <details className="field-block">
        <summary className="field-label">{he.drawer.history}</summary>
        {tx.history.length === 0 ? (
          <p className="muted">{he.drawer.noHistory}</p>
        ) : (
          <ul className="history-list">
            {tx.history.map((h, i) => (
              <li key={i}>
                {t(he.drawer.historyLine, {
                  date: formatDateTime(h.at),
                  who: h.by,
                  field: fieldLabel(h.field),
                  from: showValue(h.field, h.from),
                  to: showValue(h.field, h.to),
                })}
              </li>
            ))}
          </ul>
        )}
      </details>
    </Drawer>
  );
}
