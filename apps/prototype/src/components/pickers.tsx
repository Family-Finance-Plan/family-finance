/** CategoryPicker and MemberTagPicker (transactions.md "Quick edit popovers"). */
import { useId, useMemo, useState } from "react";
import {
  assignableCategories,
  expenseTree,
  getCategory,
} from "../demo/categories";
import type { Category, Member, Tag } from "../demo/types";
import { normalizeSearch, t } from "../lib/format";
import { he } from "../locale/he";
import { Icon } from "./Icon";

/** "מזון וקניות · סופרמרקט" (direction-neutral separator, transactions.md RTL notes). */
export function categoryLabel(id: string | null): string {
  const c = getCategory(id);
  if (!c) return he.status.uncategorized;
  const parent = c.parentId ? getCategory(c.parentId) : undefined;
  return parent ? `${parent.name} · ${c.name}` : c.name;
}

export function CategoryPicker({
  type,
  value,
  onChange,
  recent = [],
  autoFocus = true,
}: {
  type: "income" | "expense";
  value: string | null;
  onChange: (id: string) => void;
  recent?: readonly string[];
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState("");
  const listId = useId();
  const nq = normalizeSearch(q);
  const groups = useMemo((): { title: string; items: Category[] }[] => {
    const match = (c: Category) => {
      const parent = c.parentId ? getCategory(c.parentId) : undefined;
      return (
        !nq || normalizeSearch(`${parent?.name ?? ""} ${c.name}`).includes(nq)
      );
    };
    const result: { title: string; items: Category[] }[] = [];
    const recentItems = recent
      .map((id) => getCategory(id))
      .filter(
        (c): c is Category => c !== undefined && c.type === type && match(c),
      )
      .slice(0, 5);
    if (!nq && recentItems.length > 0)
      result.push({ title: he.picker.recent, items: recentItems });
    if (type === "income") {
      const items = assignableCategories("income").filter(match);
      if (items.length) result.push({ title: he.types.incomePlural, items });
    } else {
      for (const { group, children } of expenseTree()) {
        const items = children.filter(match);
        if (items.length) result.push({ title: group.name, items });
      }
    }
    return result;
  }, [nq, recent, type]);

  return (
    <div className="picker">
      <label className="picker__search">
        <span className="sr-only">{he.picker.searchCategory}</span>
        <Icon name="search" size={16} />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={he.picker.searchCategory}
          aria-controls={listId}
          data-autofocus={autoFocus ? true : undefined}
        />
      </label>
      <div
        className="picker__list"
        id={listId}
        role="listbox"
        aria-label={he.picker.categoryLabel}
      >
        {groups.length === 0 ? (
          <p className="muted picker__empty">{he.picker.noMatch}</p>
        ) : null}
        {groups.map((g) => (
          <div key={g.title} role="group" aria-label={g.title}>
            <div className="picker__group">{g.title}</div>
            {g.items.map((c) => (
              <button
                key={`${g.title}-${c.id}`}
                type="button"
                role="option"
                aria-selected={value === c.id}
                className={`picker__option ${value === c.id ? "is-selected" : ""}`}
                onClick={() => onChange(c.id)}
              >
                <span>{c.name}</span>
                {value === c.id ? <Icon name="check" size={16} /> : null}
              </button>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MemberTagPicker({
  members,
  tags,
  memberIds,
  tagIds,
  onChange,
  onCreateTag,
  showTags = true,
  autoFocus = true,
}: {
  members: readonly Member[];
  tags: readonly Tag[];
  memberIds: readonly string[];
  tagIds: readonly string[];
  onChange: (memberIds: string[], tagIds: string[]) => void;
  onCreateTag?: (name: string) => string;
  showTags?: boolean;
  autoFocus?: boolean;
}) {
  const [q, setQ] = useState("");
  const nq = normalizeSearch(q);
  const visibleMembers = members.filter(
    (m) => !nq || normalizeSearch(m.name).includes(nq),
  );
  const visibleTags = tags.filter(
    (tg) => !nq || normalizeSearch(tg.name).includes(nq),
  );
  const toggle = (list: readonly string[], id: string) =>
    list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
  const exact = tags.some((tg) => normalizeSearch(tg.name) === nq);
  return (
    <div className="picker">
      <label className="picker__search">
        <span className="sr-only">{he.picker.searchMembers}</span>
        <Icon name="search" size={16} />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={he.picker.searchMembers}
          data-autofocus={autoFocus ? true : undefined}
        />
      </label>
      <fieldset className="picker__section">
        <legend className="picker__group">{he.picker.membersSection}</legend>
        {visibleMembers.map((m) => (
          <label key={m.id} className="check-row">
            <input
              type="checkbox"
              checked={memberIds.includes(m.id)}
              onChange={() => onChange(toggle(memberIds, m.id), [...tagIds])}
            />
            <span
              className="chip__dot"
              style={{ backgroundColor: m.color }}
              aria-hidden="true"
            />
            {m.name}
          </label>
        ))}
      </fieldset>
      {showTags ? (
        <fieldset className="picker__section">
          <legend className="picker__group">{he.picker.tagsSection}</legend>
          {visibleTags.map((tg) => (
            <label key={tg.id} className="check-row">
              <input
                type="checkbox"
                checked={tagIds.includes(tg.id)}
                onChange={() => onChange([...memberIds], toggle(tagIds, tg.id))}
              />
              {tg.name}
            </label>
          ))}
          {onCreateTag && q.trim() && !exact ? (
            <button
              type="button"
              className="link-btn"
              onClick={() => {
                const id = onCreateTag(q.trim());
                onChange([...memberIds], [...tagIds, id]);
                setQ("");
              }}
            >
              <Icon name="plus" size={14} />
              {t(he.picker.createTag, { text: q.trim() })}
            </button>
          ) : null}
        </fieldset>
      ) : null}
    </div>
  );
}
