# Household

## Purpose

Manage who is in the household. Two separate lists, because they are two different things (D9):
- **Members**: people transactions can be assigned to (labels). Children, for example, are members with no login.
- **Users**: people who sign in, each with a role (D3).

A member can also be a user (a parent is both). The admin invites users by email (ADR-003). In the prototype the invite is a mock: nothing is sent.

## FR IDs covered

- FR-01 household exists (name editable here)
- FR-02 define members (also after setup)
- FR-03 several users under one household
- FR-04 user types: admin, partner, additional (limited) user (spec 2.1)
- FR-06 + D3 v0.1 permissions per role
- FR-41, FR-42 members and the shared "משפחה" tag used for assignment
- FR-45 personal tags list (create, rename)
- ADR-003 rule 3 invite by email, bound at first sign-in

## Layout

### Desktop (≥1024)

```
PageHeader: "משק הבית"   [שם משק הבית: משק בית לדוגמה ✎]
Tabs: [בני משפחה] [משתמשים והרשאות] [תגיות]
┌ Tab content ──────────────────────────────────────────────┐
│ list / table + primary action at inline-end of the header │
└───────────────────────────────────────────────────────────┘
RolesExplainer (collapsible card, "מה כל תפקיד יכול לעשות?")
```

### Phone (<600)

Tabs become a segmented control under the title (scrollable if needed); tables become card lists; dialogs become bottom sheets.

## Tab 1: Members "בני משפחה"

`MemberList`, one row per member:

| Column | Content |
|---|---|
| "שם" | display name (demo: "הורה א", "הורה ב", "ילד א", "ילד ב") with an initials avatar in a fixed colour per member |
| "משתמש/ת באפליקציה" | "כן · {role}" or "לא" |
| "תנועות משויכות" | count, link → `/transactions?member={id}` |
| actions | "עריכה", "הסרה" |

- The "משפחה" row is pinned first, read-only, with the note "תג משותף לכל משק הבית. לא ניתן להסיר." (FR-42).
- "+ הוספת בן/בת משפחה" opens `MemberDialog`: field "שם" (required, max 30, unique in the household: error "כבר יש בן/בת משפחה בשם הזה"), colour picker "צבע" (8 preset colours that pass 3:1 against white), checkbox "להזמין גם כמשתמש/ת באפליקציה" (if checked, continue to the invite dialog).
- Remove a member: if they have transactions, the dialog says "ל-{name} משויכות {n} תנועות. אחרי ההסרה התנועות יישארו, בלי השיוך הזה." Buttons "הסרה" (danger) and "ביטול". A member who is also a user must be removed as a user first: "יש להסיר קודם את הגישה לאפליקציה."

## Tab 2: Users and permissions "משתמשים והרשאות"

`UserTable`:

| Column | Content |
|---|---|
| "שם" | display name, "(את/ה)" for the current user |
| "דוא״ל" | placeholder email from demo data, `dir="ltr"` in `<bdi>` |
| "תפקיד" | `RoleSelect` for the admin; plain text for others |
| "סטטוס" | "פעיל" / "הוזמן · ממתין" (with sent date) / "פג תוקף" |
| actions | for pending invites: "שליחה מחדש", "ביטול הזמנה"; for active users: "הסרת גישה" |

Roles (D3), shown with these exact labels and one-line descriptions:

| Role key | Label | Description (shown in `RoleSelect` options and `RolesExplainer`) |
|---|---|---|
| `admin` | "מנהל/ת" | "הכל, כולל הזמנה והסרה של משתמשים ושינוי תפקידים" |
| `partner` | "שותף/ה" | "צפייה, העלאת מסמכים, אישור ועריכת תנועות. בלי ניהול משתמשים" |
| `limited` | "צפייה בלבד" | "צפייה בנתונים בלבד, בלי עריכה והעלאה" |

Rules shown in the UI:
- Only the admin sees `RoleSelect`, the invite button and the remove actions. Partner and limited users see the table read-only with the note "רק מנהל/ת יכול/ה לנהל משתמשים".
- The last admin cannot change their own role or remove themselves: the controls are disabled with tooltip "צריך להישאר לפחות מנהל/ת אחד/ת".
- Changing a role asks to confirm: "לשנות את התפקיד של {name} ל{role}?" (R-014 marks permissions as sensitive; the real build may require re-authentication, ADR-003).

### Invite flow (mock)

`InviteDialog`, opened by "+ הזמנת משתמש/ת" (admin only):

1. Fields:
   - "בן/בת משפחה" select: existing members who are not users yet, or "בן/בת משפחה חדש/ה" (adds a name field "שם").
   - "דוא״ל של חשבון Google" (required, `type="email"`, `dir="ltr"`). Hint: "ההזמנה תקפה רק לחשבון Google עם הכתובת הזו."
   - "תפקיד" radio with the three roles and their descriptions; default "שותף/ה".
2. Primary "שליחת הזמנה". Validation: invalid email → "כתובת דוא״ל לא תקינה"; already a user → "המשתמש/ת כבר במשק הבית"; already invited → "כבר נשלחה הזמנה לכתובת הזו" with "שליחה מחדש".
3. Success step in the same dialog: "ההזמנה נוצרה" + "בגרסה האמיתית תישלח הודעה לדוא״ל. באב-טיפוס לא נשלח כלום." + a read-only invite link field with "העתקה" and the link "הצגת ההזמנה כפי שהמוזמן רואה" (opens `/invite/accept` from sign-in.md in a new tab). Buttons "סגירה".
4. The user appears in the table with status "הוזמן · ממתין". The prototype offers "הדמיית קבלת ההזמנה" in the row's overflow menu to flip it to "פעיל".

## Tab 3: Tags "תגיות" (FR-45)

Simple list of personal tags (demo: "חופשה", "שיפוץ", "חוגים"): name, transactions count with link, "שינוי שם", "מחיקה" (confirm: "התגית תוסר מ-{n} תנועות. התנועות עצמן יישארו."). "+ תגית חדשה" adds an inline row. Partners can manage tags; limited users see the list only.

## States

| State | What shows |
|---|---|
| Loading | Tabs visible, 4 skeleton rows |
| Members empty (only the current user exists) | The list shows the current user and "משפחה"; below: "הוסיפו את בני המשפחה כדי לשייך אליהם תנועות." + "הוספת בן/בת משפחה" |
| Users: only the admin | Table has one row; below: "רוצים לנהל יחד? הזמינו שותף/ה." + invite button (admin only) |
| Tags empty | "עוד אין תגיות. תגיות עוזרות לסמן נושאים כמו חופשה או שיפוץ." + "תגית חדשה" |
| Error loading | `ErrorState` "לא הצלחנו לטעון את פרטי משק הבית." + retry |
| Save error | Dialog stays open, inline "השמירה נכשלה. נסו שוב." |
| Saving | Primary button disabled with "שומר…" |

## RTL notes

- Tabs read from inline-start (right): "בני משפחה" first.
- Email values and invite links are LTR inside RTL rows: `dir="ltr"` on inputs, `<bdi>` in text.
- Avatar at inline-start of the name; actions at inline-end.

## Development notes

- Components: `HouseholdPage`, `HouseholdNameEditor`, `HouseholdTabs`, `MemberList`, `MemberRow`, `MemberDialog`, `UserTable`, `RoleSelect`, `RoleBadge`, `RolesExplainer`, `InviteDialog`, `TagList`, `ConfirmDialog`.
- Permission checks in the UI come from one helper, `can(role, action)` with actions `view`, `upload`, `approve`, `editTransactions`, `manageMembers`, `manageUsers`. The table in README "Roles in the UI" is its source. UI hiding is convenience only; the real API enforces permissions (ADR-002).
- Member and user are separate entities linked by an optional `userId` on the member (D9).
- Demo emails are placeholders on a reserved domain (`@example.com`) only (R-029).

## Left out of v0.1

- Transferring the admin role to another user as a dedicated flow (possible by changing roles, with the last-admin rule).
- Leaving a household, deleting a household, user deletion policy (open in spec 11.1 item 7).
- Several households per user and a household switcher (ADR-002).
- Real email sending (notifications open, INT-07).
- Family goals (FR-45 part).
