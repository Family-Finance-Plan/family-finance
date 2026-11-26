import type {
  Account,
  AccountCoverage,
  Household,
  Member,
  Tag,
  User,
} from "./types";

/** The synthetic demo household (docs/ux/demo-data.md). Placeholder names only (R-029). */
export const demoHousehold: Household = {
  id: "hh-demo",
  name: "משק בית לדוגמה",
};

export const demoMembers: Member[] = [
  { id: "m-family", name: "משפחה", kind: "family", color: "#4A5568" },
  {
    id: "m-parent-a",
    name: "הורה א",
    kind: "person",
    color: "#2952CC",
    userId: "u-parent-a",
  },
  {
    id: "m-parent-b",
    name: "הורה ב",
    kind: "person",
    color: "#9C2A6B",
    userId: "u-parent-b",
  },
  { id: "m-child-a", name: "ילד א", kind: "person", color: "#0F6E6E" },
  { id: "m-child-b", name: "ילד ב", kind: "person", color: "#8A5300" },
];

export const demoUsers: User[] = [
  {
    id: "u-parent-a",
    displayName: "הורה א",
    email: "parent-a@example.com",
    role: "admin",
    status: "active",
  },
  {
    id: "u-parent-b",
    displayName: "הורה ב",
    email: "parent-b@example.com",
    role: "partner",
    status: "active",
  },
  {
    id: "u-invited",
    displayName: "סבתא (דוגמה)",
    email: "invited-user@example.com",
    role: "limited",
    status: "invited",
    invitedAt: "2026-10-12",
  },
];

export const demoTags: Tag[] = [
  { id: "t-vacation", name: "חופשה" },
  { id: "t-renovation", name: "שיפוץ" },
  { id: "t-classes", name: "חוגים" },
];

export const demoAccounts: Account[] = [
  { id: "acc-a", name: "חשבון עו״ש א", kind: "bank", currency: "ILS" },
  { id: "acc-b", name: "חשבון עו״ש ב", kind: "bank", currency: "ILS" },
  {
    id: "card-a",
    name: "כרטיס אשראי א",
    kind: "card",
    chargedTo: "acc-a",
    itemized: false,
  },
];

export const demoCoverage: AccountCoverage[] = [
  { accountId: "acc-a", from: "2026-08-01", to: "2026-10-15" },
  { accountId: "acc-b", from: "2026-08-01", to: "2026-09-30" },
];

/** Mock Google identities offered by MockGoogleChooser (sign-in.md). */
export const NEW_USER_ID = "u-new";
export const newUserIdentity: User = {
  id: NEW_USER_ID,
  displayName: "משתמש/ת חדש/ה",
  email: "new-user@example.com",
  role: "admin",
  status: "active",
};

/** Preset member colours that pass 3:1 against white (household.md). */
export const memberColors = [
  "#2952CC",
  "#1B7F3B",
  "#B42318",
  "#8A5300",
  "#6B3FA0",
  "#0F6E6E",
  "#9C2A6B",
  "#4A5568",
] as const;
