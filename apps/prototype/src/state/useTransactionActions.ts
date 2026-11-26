/** Transaction edits with history, toasts and undo (transactions.md). */
import { useCallback } from "react";
import { DEMO_NOW, DEMO_TODAY } from "../demo/demo-today";
import type { Transaction } from "../demo/types";
import { useToast } from "../components/feedback";
import { t } from "../lib/format";
import { he } from "../locale/he";
import {
  deleteTransactions,
  newId,
  restoreSnapshots,
  restoreTransactions,
  type TransactionPatch,
  updateTransactions,
} from "./household-data";
import { useCurrent } from "./store";

export function useTransactionActions() {
  const { data, user, update } = useCurrent();
  const toast = useToast();

  const patch = useCallback(
    (
      ids: readonly string[],
      patchFor: (t: Transaction) => TransactionPatch | null,
      message: string,
    ) => {
      const before = data.transactions.filter((x) => ids.includes(x.id));
      update((d) =>
        updateTransactions(d, ids, patchFor, user.displayName, DEMO_NOW),
      );
      toast.show(message, {
        action: {
          label: he.common.undo,
          onClick: () => update((d) => restoreSnapshots(d, before)),
        },
      });
    },
    [data.transactions, update, user.displayName, toast],
  );

  const remove = useCallback(
    (ids: readonly string[]) => {
      update((d) => deleteTransactions(d, ids, DEMO_TODAY));
      toast.show(
        ids.length === 1
          ? he.transactions.deleted
          : t(he.transactions.deletedMany, { n: ids.length }),
        {
          durationMs: 10000,
          action: {
            label: he.common.undo,
            onClick: () => update((d) => restoreTransactions(d, ids)),
          },
        },
      );
    },
    [update, toast],
  );

  const restore = useCallback(
    (ids: readonly string[]) => {
      update((d) => restoreTransactions(d, ids));
      toast.show(he.transactions.restored);
    },
    [update, toast],
  );

  const createTag = useCallback(
    (name: string): string => {
      const id = newId("t");
      update((d) => ({ ...d, tags: [...d.tags, { id, name }] }));
      return id;
    },
    [update],
  );

  /** Most recently used categories, for the picker's "אחרונות" section. */
  const recentCategories = [...data.transactions]
    .filter((x) => x.categoryId !== null)
    .slice(-40)
    .toReversed()
    .map((x) => x.categoryId as string)
    .filter((id, i, all) => all.indexOf(id) === i)
    .slice(0, 5);

  return { patch, remove, restore, createTag, recentCategories };
}
