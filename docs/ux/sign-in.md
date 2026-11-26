# Sign in and first-run setup

## Purpose

Let a person sign in with Google (ADR-003) and, if they have no household yet, create one and define its members. An invited person lands directly in the household they were invited to. In the prototype, sign-in is a mock: no Google call, no real account.

## FR IDs covered

- FR-01 set up a new household
- FR-02 define household members during setup
- FR-03 several users under one household (accepting an invite)
- FR-04 user types (the creator becomes admin)
- FR-05 a new household in a few clicks (a new tenant per ADR-001)
- INT-06 / ADR-003 Google sign-in; D9 only app users sign in

## Routes and flow

```
/sign-in ──(mock Google)──► has household? ──yes──► /
                                  │
                                  no ──► invite pending? ──yes──► /invite/accept ──► /
                                                │
                                                no ──► /setup (2 steps) ──► /
```

Prototype: the sign-in button opens `MockGoogleChooser`, a small dialog listing three demo identities (see demo-data.md): "הורה א (מנהל/ת)", "הורה ב (שותף/ה)", "משתמש/ת חדש/ה (ללא משק בית)". The third goes through `/setup`.

## Screen 1: Sign in (`/sign-in`)

### Layout

Desktop and phone share a single centered card (max inline size 400px). No AppShell; `PrototypeBanner` stays on top.

```
┌──────── PrototypeBanner ────────┐
│                                 │
│      [logo mark]                │
│      ניהול כספי משפחה           │
│      tagline                    │
│  ┌───────────────────────────┐  │
│  │ [G]  כניסה עם Google      │  │
│  └───────────────────────────┘  │
│  privacy line                   │
└─────────────────────────────────┘
```

Phone: the card fills the width with 16px gutters; button full width.

### Components and copy

| Key | Hebrew | Notes |
|---|---|---|
| `signIn.title` | "ניהול כספי משפחה" | reuse `appName` |
| `signIn.tagline` | "תמונה אחת ברורה של הכסף של המשפחה" | |
| `signIn.google` | "כניסה עם Google" | `GoogleSignInButton`, follows Google branding (white button, G mark at inline-start) |
| `signIn.privacy` | "הכניסה מתבצעת דרך חשבון Google. אנחנו לא שומרים סיסמה." | `--text-muted`, `--fs-sm` |
| `signIn.mfaTip` | "מומלץ להפעיל אימות דו-שלבי בחשבון Google." | ADR-003 limitation |

### States

| State | What shows |
|---|---|
| Default | As above |
| Loading (after click) | Button disabled with inline spinner and "מתחבר…" |
| Error: cancelled | Inline message under the button: "הכניסה בוטלה. אפשר לנסות שוב." |
| Error: unverified email (ADR-003 rule 2) | "כתובת הדוא״ל בחשבון Google לא אומתה. יש לאמת אותה ב-Google ולנסות שוב." |
| Error: network | "אין חיבור לשרת. בדקו את החיבור ונסו שוב." + "נסו שוב" |
| Signed out (after sign-out or session expiry) | Info line above the button: "יצאת מהמערכת." / "פג תוקף ההתחברות. יש להתחבר שוב." |

Prototype: the chooser dialog has a fourth option "הדמיית שגיאה" that cycles through the error states.

## Screen 2: Household setup (`/setup`)

Two steps in one `SetupWizard`, with a step indicator "שלב 1 מתוך 2". `Back` / `Next` buttons at the bottom; in RTL, "הבא" (next) is at inline-end (left) and "חזרה" (back) at inline-start (right).

### Step 1: Household name

- Field `setup.householdName` label "שם משק הבית", hint "יופיע רק לכם ולמי שתזמינו", placeholder "לדוגמה: משק הבית שלנו", required, max 40 characters.
- Error: empty → "יש להזין שם למשק הבית".

### Step 2: Household members (FR-02, D9)

Explains that members are people transactions can be assigned to, and that only people who use the app sign in.

- Intro text: "מי במשק הבית? אפשר לשייך תנועות לכל אחד מהם. רק מי שמשתמש באפליקציה צריך להתחבר."
- The signed-in user is row 1, prefilled with their Google display name, marked "את/ה" and "מנהל/ת", not removable.
- `MemberRow` × n: field "שם" (required), toggle "משתמש/ת באפליקציה" (off by default; when on, shows an email field "דוא״ל להזמנה" and a role select, see household.md). Remove button with `aria-label="הסרת {name}"`.
- "+ הוספת בן/בת משפחה" adds a row and focuses its name field.
- The "משפחה" tag is created automatically and shown as a read-only chip with the note "תג משותף לכל משק הבית" (FR-42).
- Primary button: "יצירת משק הבית".

### States

| State | What shows |
|---|---|
| Saving | Primary button disabled, "יוצר משק בית…" |
| Error | Banner at top of the card: "לא הצלחנו ליצור את משק הבית. נסו שוב." Fields keep their values |
| Success | Navigate to `/` with toast "משק הבית נוצר. אפשר להתחיל בהעלאת דף חשבון." and the Dashboard empty state (see dashboard.md) |

## Screen 3: Accept invite (`/invite/accept`)

Card with "הוזמנת להצטרף למשק הבית {householdName}", role line "תפקיד: {role}", buttons "הצטרפות" (primary) and "לא עכשיו". Invalid or expired link: "ההזמנה אינה בתוקף. בקשו ממנהל/ת משק הבית הזמנה חדשה." In the prototype this screen is reached from household.md's "הצגת ההזמנה כפי שהמוזמן רואה" link.

## RTL notes

- Wizard buttons: primary at inline-end. Use `justify-content: space-between` in a flex row; RTL flips it naturally.
- The Google button keeps the G mark at inline-start (right in RTL), as Google's own Hebrew UI does.
- Email fields: set `dir="ltr"` on the `<input>` only; the label and hint stay RTL.

## Development notes

- Components: `SignInPage`, `GoogleSignInButton`, `MockGoogleChooser` (prototype only, behind `import.meta.env.VITE_PROTOTYPE`), `SetupWizard`, `MemberRow`, `InviteAcceptPage`.
- Auth state lives in a `SessionProvider` with a mock adapter; the real OIDC adapter replaces it later behind the same interface (ADR-003).
- The tenant comes from the session, never from the URL (R-003). Routes carry no household ID.
- Focus: on load, focus the Google button; on wizard step change, move focus to the step heading.

## Left out of v0.1

- Other identity providers, password, MFA enforcement (ADR-003).
- Belonging to more than one household (ADR-002): no household switcher.
- "Sign out from all devices" is a Settings item for later; v0.1 has plain sign-out only.
