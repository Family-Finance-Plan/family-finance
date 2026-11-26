/** Shared transaction rows: desktop table and phone card list, with quick-edit chips. */
import { type ReactNode, useState } from "react";
import type { Member, Tag, Transaction } from "../demo/types";
import { t } from "../lib/format";
import { he } from "../locale/he";
import { isCardCharge } from "../lib/selectors";
import { useCurrent } from "../state/store";
import { useTransactionActions } from "../state/useTransactionActions";
import { Icon } from "./Icon";
import { Popover } from "./overlays";
import { CategoryPicker, categoryLabel, MemberTagPicker } from "./pickers";
import {
  Amount,
  Chip,
  DateCell,
  NotItemizedBadge,
  TypeBadge,
} from "./primitives";

function QuickCategory({
  tx,
  editable,
}: {
  tx: Transaction;
  editable: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { patch, recentCategories } = useTransactionActions();
  if (isCardCharge(tx)) return <NotItemizedBadge />;
  if (tx.type === "transfer")
    return <span className="muted">{he.picker.transferNoCategory}</span>;
  const label = categoryLabel(tx.categoryId);
  const chip = (
    <Chip variant={tx.categoryId ? "solid" : "dashed"}>{label}</Chip>
  );
  if (!editable) return chip;
  return (
    <span className="popover-anchor">
      <button
        type="button"
        className="chip-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${he.table.category}: ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((o) => !o);
        }}
      >
        {chip}
      </button>
      {open ? (
        <Popover label={he.picker.categoryLabel} onClose={() => setOpen(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <CategoryPicker
              type={tx.type === "income" ? "income" : "expense"}
              value={tx.categoryId}
              recent={recentCategories}
              onChange={(id) => {
                setOpen(false);
                if (id !== tx.categoryId)
                  patch(
                    [tx.id],
                    () => ({ categoryId: id }),
                    he.transactions.categoryUpdated,
                  );
              }}
            />
          </div>
        </Popover>
      ) : null}
    </span>
  );
}

export function AssignmentChips({
  memberIds,
  tagIds,
  members,
  tags,
  max = 2,
}: {
  memberIds: readonly string[];
  tagIds: readonly string[];
  members: readonly Member[];
  tags: readonly Tag[];
  max?: number;
}) {
  const items: ReactNode[] = [
    ...memberIds.map((id) => {
      const m = members.find((x) => x.id === id);
      return m ? (
        <Chip key={id} color={m.color}>
          {m.name}
        </Chip>
      ) : null;
    }),
    ...tagIds.map((id) => {
      const tg = tags.find((x) => x.id === id);
      return tg ? (
        <Chip key={id} variant="outline">
          #{tg.name}
        </Chip>
      ) : null;
    }),
  ].filter(Boolean);
  if (items.length === 0)
    return <Chip variant="dashed">{he.table.addAssignment}</Chip>;
  const extra = items.length - max;
  return (
    <span className="chips">
      {items.slice(0, max)}
      {extra > 0 ? (
        <span className="chip chip--more">
          {t(he.table.plusN, { n: extra })}
        </span>
      ) : null}
    </span>
  );
}

function QuickMembers({
  tx,
  editable,
  max,
}: {
  tx: Transaction;
  editable: boolean;
  max: number;
}) {
  const { data } = useCurrent();
  const { patch, createTag } = useTransactionActions();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<{ m: string[]; t: string[] }>({
    m: tx.memberIds,
    t: tx.tagIds,
  });
  const chips = (
    <AssignmentChips
      memberIds={tx.memberIds}
      tagIds={tx.tagIds}
      members={data.members}
      tags={data.tags}
      max={max}
    />
  );
  if (!editable) return chips;
  const close = () => {
    setOpen(false);
    const changed =
      JSON.stringify(draft.m) !== JSON.stringify(tx.memberIds) ||
      JSON.stringify(draft.t) !== JSON.stringify(tx.tagIds);
    if (changed)
      patch(
        [tx.id],
        () => ({ memberIds: draft.m, tagIds: draft.t }),
        he.transactions.assignmentUpdated,
      );
  };
  return (
    <span className="popover-anchor">
      <button
        type="button"
        className="chip-btn"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={he.table.assignmentAndTags}
        onClick={(e) => {
          e.stopPropagation();
          if (open) close();
          else {
            setDraft({ m: tx.memberIds, t: tx.tagIds });
            setOpen(true);
          }
        }}
      >
        {chips}
      </button>
      {open ? (
        <Popover label={he.table.assignmentAndTags} onClose={close}>
          <div onClick={(e) => e.stopPropagation()}>
            <MemberTagPicker
              members={data.members}
              tags={data.tags}
              memberIds={draft.m}
              tagIds={draft.t}
              onChange={(m, tg) => setDraft({ m, t: tg })}
              onCreateTag={createTag}
            />
            <div className="popover__footer">
              <button
                type="button"
                className="btn btn--primary btn--sm"
                onClick={close}
              >
                {he.picker.done}
              </button>
            </div>
          </div>
        </Popover>
      ) : null}
    </span>
  );
}

function accountName(
  accounts: { id: string; name: string }[],
  id: string,
): string {
  return accounts.find((a) => a.id === id)?.name ?? id;
}

export interface TableOptions {
  selectable?: boolean;
  selected?: ReadonlySet<string>;
  onToggle?: (id: string) => void;
  onOpen?: (tx: Transaction) => void;
  rowMenu?: (tx: Transaction) => ReactNode;
  highlightId?: string | null;
  showTypeColumn?: boolean;
  /** Extra rows rendered after the transactions (preview layer future rows). */
  after?: ReactNode;
  sortHeader?: (
    column: "date" | "description" | "amount",
    label: string,
  ) => ReactNode;
}

export function TransactionTable({
  rows,
  options = {},
}: {
  rows: readonly Transaction[];
  options?: TableOptions;
}) {
  const { data, can } = useCurrent();
  const editable = can("editTransactions");
  const header = (col: "date" | "description" | "amount", label: string) =>
    options.sortHeader ? options.sortHeader(col, label) : label;
  return (
    <table className="tx-table">
      <thead>
        <tr>
          {options.selectable ? (
            <th scope="col" className="col-check">
              <span className="sr-only">{he.table.select}</span>
            </th>
          ) : null}
          <th scope="col" className="col-date">
            {header("date", he.table.date)}
          </th>
          <th scope="col">{header("description", he.table.description)}</th>
          <th scope="col" className="col-cat">
            {he.table.category}
          </th>
          <th scope="col" className="col-assign">
            {he.table.assignment}
          </th>
          <th scope="col" className="col-type">
            {he.table.type}
          </th>
          <th scope="col" className="col-amount">
            {header("amount", he.table.amount)}
          </th>
          {options.rowMenu ? (
            <th scope="col" className="col-menu">
              <span className="sr-only">{he.table.actions}</span>
            </th>
          ) : null}
        </tr>
      </thead>
      <tbody>
        {rows.map((tx) => (
          <tr
            key={tx.id}
            className={`tx-row ${isCardCharge(tx) ? "tx-row--not-itemized" : ""} ${
              options.highlightId === tx.id ? "is-highlighted" : ""
            } ${options.selected?.has(tx.id) ? "is-selected" : ""}`}
            tabIndex={options.onOpen ? 0 : undefined}
            onClick={() => options.onOpen?.(tx)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && e.target === e.currentTarget)
                options.onOpen?.(tx);
            }}
          >
            {options.selectable ? (
              <td className="col-check" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={options.selected?.has(tx.id) ?? false}
                  onChange={() => options.onToggle?.(tx.id)}
                  aria-label={t(he.transactions.selectRow, {
                    description: tx.description,
                  })}
                />
              </td>
            ) : null}
            <td className="col-date">
              <DateCell date={tx.date} />
            </td>
            <td>
              <div className="tx-desc">
                <bdi>{tx.description}</bdi>
              </div>
              <div className="tx-sub muted">
                {accountName(data.accounts, tx.accountId)}
              </div>
            </td>
            <td
              className="col-cat"
              onClick={(e) => editable && e.stopPropagation()}
            >
              <QuickCategory tx={tx} editable={editable && !tx.deletedAt} />
            </td>
            <td
              className="col-assign"
              onClick={(e) => editable && e.stopPropagation()}
            >
              <QuickMembers
                tx={tx}
                editable={editable && !tx.deletedAt}
                max={options.selectable ? 3 : 2}
              />
            </td>
            <td className="col-type">
              <TypeBadge type={tx.type} />
            </td>
            <td className="col-amount">
              <Amount
                agorot={tx.amountAgorot}
                type={tx.type}
                {...(tx.original ? { original: tx.original } : {})}
              />
            </td>
            {options.rowMenu ? (
              <td className="col-menu" onClick={(e) => e.stopPropagation()}>
                {options.rowMenu(tx)}
              </td>
            ) : null}
          </tr>
        ))}
        {options.after}
      </tbody>
    </table>
  );
}

/** Phone list: one card per transaction (dashboard.md TransactionCardList). */
export function TransactionCards({
  rows,
  options = {},
}: {
  rows: readonly Transaction[];
  options?: TableOptions;
}) {
  const { data, can } = useCurrent();
  const editable = can("editTransactions");
  return (
    <ul className="tx-cards">
      {rows.map((tx) => (
        <li
          key={tx.id}
          className={`tx-card ${isCardCharge(tx) ? "tx-row--not-itemized" : ""} ${
            options.selected?.has(tx.id) ? "is-selected" : ""
          }`}
        >
          {options.selectable ? (
            <input
              type="checkbox"
              className="tx-card__check"
              checked={options.selected?.has(tx.id) ?? false}
              onChange={() => options.onToggle?.(tx.id)}
              aria-label={t(he.transactions.selectRow, {
                description: tx.description,
              })}
            />
          ) : null}
          <button
            type="button"
            className="tx-card__main"
            onClick={() => options.onOpen?.(tx)}
          >
            <span className="tx-card__line1">
              <bdi className="tx-desc">{tx.description}</bdi>
              <Amount agorot={tx.amountAgorot} type={tx.type} />
            </span>
            <span className="tx-card__line2 muted">
              <DateCell date={tx.date} /> ·{" "}
              {accountName(data.accounts, tx.accountId)}
            </span>
          </button>
          <span className="tx-card__line3">
            <QuickCategory tx={tx} editable={editable && !tx.deletedAt} />
            <QuickMembers
              tx={tx}
              editable={editable && !tx.deletedAt}
              max={2}
            />
            {options.rowMenu ? options.rowMenu(tx) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function MonthGroupHeader({
  expanded,
  onToggle,
  title,
  summary,
  tag,
  controls,
  leading,
}: {
  expanded: boolean;
  onToggle: () => void;
  title: string;
  summary: ReactNode;
  tag?: ReactNode;
  controls: string;
  leading?: ReactNode;
}) {
  return (
    <div className="month-header">
      {leading}
      <button
        type="button"
        className="month-header__btn"
        aria-expanded={expanded}
        aria-controls={controls}
        onClick={onToggle}
      >
        <Icon
          name={expanded ? "chevronDown" : "chevron"}
          directional={!expanded}
          className="month-header__chev"
        />
        <span className="month-header__title">{title}</span>
        {tag}
        <span className="month-header__summary">{summary}</span>
      </button>
    </div>
  );
}
