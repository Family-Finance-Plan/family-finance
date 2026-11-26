/**
 * App-wide in-memory state: households, the mock session and the upload queue.
 * The tenant (household) comes from the session only, never from the URL (R-003).
 */
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { doc006Rows } from "../demo/documents";
import { DEMO_NOW } from "../demo/demo-today";
import { NEW_USER_ID, newUserIdentity } from "../demo/household";
import type { FailureReason, Role, User } from "../demo/types";
import { type Action, can as canDo } from "../lib/permissions";
import {
  createDemoHousehold,
  type HouseholdData,
  newId,
} from "./household-data";

export interface Session {
  userId: string;
  householdId: string | null;
  /** Prototype-only role switcher in the UserMenu. */
  roleOverride?: Role;
}

export type QueueStatus =
  | "error"
  | "uploading"
  | "duplicate-file"
  | "extracting"
  | "ready"
  | "failed"
  | "card";

export interface QueueItem {
  id: string;
  fileName: string;
  sizeBytes: number;
  status: QueueStatus;
  progress: number;
  slow?: boolean;
  error?: "unsupported" | "too-large";
  documentId?: string;
  failureReason?: FailureReason;
}

export interface AppState {
  households: Record<string, HouseholdData>;
  /** Users without a household yet (the mock "new user" identity). */
  looseUsers: User[];
  session: Session | null;
  signedOutReason: "signed-out" | "expired" | null;
  queue: QueueItem[];
}

export function createInitialState(session: Session | null = null): AppState {
  const demo = createDemoHousehold();
  return {
    households: { [demo.household.id]: demo },
    looseUsers: [newUserIdentity],
    session,
    signedOutReason: null,
    queue: [],
  };
}

interface StoreValue {
  state: AppState;
  setState: (update: (s: AppState) => AppState) => void;
  enqueueFiles: (files: readonly { name: string; size: number }[]) => number;
  continueDuplicate: (itemId: string) => void;
  removeQueueItem: (itemId: string) => void;
  retryQueueItem: (itemId: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

const ACCEPTED = /\.(pdf|csv|xlsx|xls|jpe?g|png|heic)$/i;
const MAX_BYTES = 10 * 1024 * 1024; // D10
/** Fake timings of the prototype "upload" and "extraction". */
export const TIMINGS = { progressStep: 180, slowAfter: 1200, extraction: 2500 };

export function StoreProvider({
  children,
  initialState,
}: {
  children: ReactNode;
  initialState?: AppState;
}) {
  const [state, setRaw] = useState<AppState>(
    () => initialState ?? createInitialState(),
  );
  // Fake upload/extraction timers; cleared when the provider unmounts.
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());
  const later = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.current.delete(id);
      fn();
    }, ms);
    timers.current.add(id);
  }, []);
  useEffect(() => {
    const pending = timers.current;
    return () => {
      for (const id of pending) clearTimeout(id);
      pending.clear();
    };
  }, []);
  const stateRef = useRef(state);
  useLayoutEffect(() => {
    stateRef.current = state;
  });
  const setState = useCallback((update: (s: AppState) => AppState) => {
    setRaw((s) => {
      const next = update(s);
      stateRef.current = next;
      return next;
    });
  }, []);

  const patchItem = useCallback(
    (id: string, patch: Partial<QueueItem>) =>
      setState((s) => ({
        ...s,
        queue: s.queue.map((q) => (q.id === id ? { ...q, ...patch } : q)),
      })),
    [setState],
  );

  /** Canned extraction result by file name (upload-and-review.md). File contents are never read. */
  const finishExtraction = useCallback(
    (id: string) => {
      const s = stateRef.current;
      const item = s.queue.find((q) => q.id === id);
      const session = s.session;
      if (!item || !session?.householdId) return;
      const name = item.fileName.toLowerCase();
      const householdId = session.householdId;
      const documentId = newId("doc");
      if (name.includes("fail")) {
        const reason: FailureReason = "password-protected";
        setState((st) => {
          const hh = st.households[householdId];
          if (!hh) return st;
          return {
            ...st,
            households: {
              ...st.households,
              [householdId]: {
                ...hh,
                documents: [
                  {
                    id: documentId,
                    fileName: item.fileName,
                    sizeBytes: item.sizeBytes,
                    uploadedAt: DEMO_NOW,
                    uploadedBy: session.userId,
                    status: "failed",
                    failureReason: reason,
                  },
                  ...hh.documents,
                ],
              },
            },
          };
        });
        patchItem(id, { status: "failed", failureReason: reason, documentId });
        return;
      }
      if (name.includes("card")) {
        // Itemized card statements are not imported in v0.1 (ADR-004, owner decision 3).
        patchItem(id, { status: "card" });
        return;
      }
      const rows = doc006Rows().map((r) => ({
        ...r,
        id: `${documentId}-${r.id}`,
      }));
      setState((st) => {
        const hh = st.households[householdId];
        if (!hh) return st;
        return {
          ...st,
          households: {
            ...st.households,
            [householdId]: {
              ...hh,
              documents: [
                {
                  id: documentId,
                  fileName: item.fileName,
                  sizeBytes: item.sizeBytes,
                  uploadedAt: DEMO_NOW,
                  uploadedBy: session.userId,
                  detected: {
                    kind: "bank-statement",
                    accountIds: ["acc-b"],
                    from: "2026-09-28",
                    to: "2026-10-15",
                  },
                  status: "awaiting-review",
                },
                ...hh.documents,
              ],
              reviews: { ...hh.reviews, [documentId]: rows },
            },
          },
        };
      });
      patchItem(id, { status: "ready", documentId });
    },
    [patchItem, setState],
  );

  const startExtraction = useCallback(
    (id: string) => {
      patchItem(id, { status: "extracting", slow: false });
      later(() => patchItem(id, { slow: true }), TIMINGS.slowAfter);
      later(() => finishExtraction(id), TIMINGS.extraction);
    },
    [finishExtraction, later, patchItem],
  );

  const startUpload = useCallback(
    (id: string, fileName: string) => {
      let progress = 0;
      const tick = () => {
        progress += 25;
        if (progress < 100) {
          patchItem(id, { progress });
          later(tick, TIMINGS.progressStep);
          return;
        }
        patchItem(id, { progress: 100 });
        if (fileName.toLowerCase().includes("dup"))
          patchItem(id, { status: "duplicate-file" });
        else startExtraction(id);
      };
      later(tick, TIMINGS.progressStep);
    },
    [later, patchItem, startExtraction],
  );

  const enqueueFiles = useCallback(
    (files: readonly { name: string; size: number }[]) => {
      const items: QueueItem[] = files.map((f) => {
        const base = {
          id: newId("q"),
          fileName: f.name,
          sizeBytes: f.size,
          progress: 0,
        };
        if (!ACCEPTED.test(f.name))
          return { ...base, status: "error", error: "unsupported" };
        if (f.size > MAX_BYTES)
          return { ...base, status: "error", error: "too-large" };
        return { ...base, status: "uploading" };
      });
      setState((s) => ({ ...s, queue: [...items, ...s.queue] }));
      for (const item of items)
        if (item.status === "uploading") startUpload(item.id, item.fileName);
      return items.length;
    },
    [setState, startUpload],
  );

  const value = useMemo<StoreValue>(
    () => ({
      state,
      setState,
      enqueueFiles,
      continueDuplicate: (id) => startExtraction(id),
      removeQueueItem: (id) =>
        setState((s) => ({ ...s, queue: s.queue.filter((q) => q.id !== id) })),
      retryQueueItem: (id) => startExtraction(id),
    }),
    [state, setState, enqueueFiles, startExtraction],
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore(): StoreValue {
  const v = useContext(StoreContext);
  if (!v) throw new Error("useStore outside StoreProvider");
  return v;
}

export function findUser(state: AppState, userId: string): User | undefined {
  for (const hh of Object.values(state.households)) {
    const u = hh.users.find((x) => x.id === userId);
    if (u) return u;
  }
  return state.looseUsers.find((u) => u.id === userId);
}

export interface Current {
  data: HouseholdData;
  user: User;
  /** Effective role (the prototype role switcher wins). */
  role: Role;
  can: (action: Action) => boolean;
  update: (fn: (d: HouseholdData) => HouseholdData) => void;
}

/** The signed-in user's household. Only used under signed-in routes. */
export function useCurrent(): Current {
  const { state, setState } = useStore();
  const session = state.session;
  const householdId = session?.householdId ?? null;
  const data = householdId ? state.households[householdId] : undefined;
  const user = session ? findUser(state, session.userId) : undefined;
  const update = useCallback(
    (fn: (d: HouseholdData) => HouseholdData) =>
      setState((s) => {
        if (!householdId) return s;
        const hh = s.households[householdId];
        return hh
          ? { ...s, households: { ...s.households, [householdId]: fn(hh) } }
          : s;
      }),
    [householdId, setState],
  );
  if (!session || !data || !user)
    throw new Error("useCurrent requires a signed-in household");
  const role = session.roleOverride ?? user.role;
  return { data, user, role, can: (a) => canDo(role, a), update };
}

export { NEW_USER_ID };
