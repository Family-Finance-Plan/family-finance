import type { Role } from "../demo/types";

/** UI permission actions (household.md). UI hiding is convenience only; the real API enforces. */
export type Action =
  | "view"
  | "upload"
  | "approve"
  | "editTransactions"
  | "manageMembers"
  | "manageTags"
  | "manageUsers";

/** Source: docs/ux/README.md "Roles in the UI" (D3). */
const matrix: Record<Role, readonly Action[]> = {
  admin: [
    "view",
    "upload",
    "approve",
    "editTransactions",
    "manageMembers",
    "manageTags",
    "manageUsers",
  ],
  partner: [
    "view",
    "upload",
    "approve",
    "editTransactions",
    "manageMembers",
    "manageTags",
  ],
  limited: ["view"],
};

export function can(role: Role, action: Action): boolean {
  return matrix[role].includes(action);
}
