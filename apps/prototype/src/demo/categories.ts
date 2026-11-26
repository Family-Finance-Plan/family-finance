import type { Category } from "./types";

/**
 * Default category list (D8, docs/ux/demo-data.md). Names are Hebrew data, not UI copy.
 * Top-level expense groups have no parent; subcategories point to their group.
 */
const expenseGroups: [string, string, [string, string][]][] = [
  [
    "housing",
    "דיור ואחזקת הבית",
    [
      ["mortgage", "משכנתא"],
      ["arnona", "ארנונה"],
      ["electricity", "חשמל"],
      ["water", "מים"],
      ["gas", "גז"],
      ["building", "ועד בית"],
      ["repairs", "תחזוקה ותיקונים"],
    ],
  ],
  [
    "food",
    "מזון וקניות",
    [
      ["supermarket", "סופרמרקט"],
      ["household-shopping", "קניות לבית"],
      ["restaurants", "מסעדות"],
      ["delivery", "משלוחים"],
      ["cafes", "בתי קפה"],
    ],
  ],
  [
    "kids",
    "ילדים ומשפחה",
    [
      ["education", "מסגרות חינוך"],
      ["after-school", "חוגים"],
      ["kids-clothing", "ביגוד"],
      ["toys", "צעצועים"],
      ["baby", "ציוד לתינוקות"],
      ["kids-health", "בריאות ילדים"],
    ],
  ],
  [
    "transport",
    "תחבורה ורכב",
    [
      ["fuel", "דלק"],
      ["car-insurance", "ביטוח רכב"],
      ["service", "טיפולים"],
      ["vehicle-test", "טסט"],
      ["parking", "חניה"],
      ["public-transport", "תחבורה ציבורית"],
    ],
  ],
  [
    "health",
    "בריאות ורווחה",
    [
      ["medicine", "תרופות"],
      ["doctors", "רופאים"],
      ["health-insurance", "ביטוח"],
      ["treatments", "טיפולים"],
      ["gym", "חדר כושר"],
    ],
  ],
  [
    "personal",
    "צריכה אישית",
    [
      ["clothing", "ביגוד"],
      ["shoes", "הנעלה"],
      ["grooming", "טיפוח"],
      ["hairdresser", "מספרה"],
      ["electronics", "מוצרי חשמל ואלקטרוניקה"],
    ],
  ],
  [
    "leisure",
    "פנאי ובילוי",
    [
      ["vacations", "חופשות"],
      ["trips", "טיולים"],
      ["shows", "הופעות"],
      ["hobbies", "תחביבים"],
      ["subscriptions", "מנויים"],
    ],
  ],
  [
    "financial",
    "הוצאות פיננסיות",
    [
      ["bank-fees", "עמלות בנק"],
      ["interest", "ריבית"],
      ["management-fees", "דמי ניהול"],
      ["loan-repayment", "החזרי הלוואות"],
    ],
  ],
  [
    "other",
    "אחר",
    [
      ["unclassified", "טרם סווג"],
      ["special", "הוצאות מיוחדות"],
      ["misc", "שונות"],
    ],
  ],
];

const incomeCategories: [string, string][] = [
  ["salary-parent-a", "משכורת – הורה א"],
  ["salary-parent-b", "משכורת – הורה ב"],
  ["business", "הכנסה מעסק או עבודה נוספת"],
  ["benefits", "קצבאות והטבות"],
  ["rent", "הכנסה משכירות"],
  ["investment-income", "הכנסה מהשקעות"],
  ["refunds", "החזרים וזיכויים"],
  ["one-time-income", "הכנסה חד-פעמית"],
];

export const categories: Category[] = [
  ...expenseGroups.flatMap(([id, name, subs]): Category[] => [
    { id, name, type: "expense" },
    ...subs.map(([subId, subName]): Category => ({
      id: subId,
      name: subName,
      type: "expense",
      parentId: id,
    })),
  ]),
  ...incomeCategories.map(([id, name]): Category => ({
    id,
    name,
    type: "income",
  })),
];

const byId = new Map(categories.map((c) => [c.id, c]));

export function getCategory(
  id: string | null | undefined,
): Category | undefined {
  return id ? byId.get(id) : undefined;
}

/** The group a category is reported under: the parent for subcategories, itself otherwise. */
export function reportingGroup(id: string): Category | undefined {
  const c = byId.get(id);
  if (!c) return undefined;
  return c.parentId ? byId.get(c.parentId) : c;
}

/** Categories a transaction of this type can be assigned to (leaf categories only). */
export function assignableCategories(type: "income" | "expense"): Category[] {
  return categories.filter(
    (c) => c.type === type && (type === "income" || c.parentId !== undefined),
  );
}

/** Expense groups with their subcategories, for tree pickers. */
export function expenseTree(): { group: Category; children: Category[] }[] {
  return categories
    .filter((c) => c.type === "expense" && !c.parentId)
    .map((group) => ({
      group,
      children: categories.filter((c) => c.parentId === group.id),
    }));
}
