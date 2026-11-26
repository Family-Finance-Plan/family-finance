# Settings

## Purpose

Let each person adjust how the app looks and behaves on their own device: colour theme, text size, density, motion and the start page. Added on the owner's request during the UX1 review (2026-11-26).

These are display preferences, not household data. They are saved per device (in the prototype: `localStorage`) and never change what other household members see. In the real app they may also be saved per user on the server so they follow the person between devices; that is a later decision.

## Route and entry points

- Route: `/settings`.
- Side nav and bottom nav: "הגדרות" (sliders icon), last item.
- User menu: "הגדרות" button above "יציאה".
- Every role can open it, including "צפייה בלבד": nothing here changes household data.

## Layout

```
הגדרות
ההגדרות האלה נשמרות במכשיר הזה בלבד...

┌ תצוגה ─────────────────────────────────────┐
│ ערכת צבעים   (לפי המכשיר) (בהירה) (כהה)       │
│ גודל טקסט    (קטן) (רגיל) (גדול) (גדול מאוד)   │
│ [preview line with an amount]               │
│ צפיפות       (מרווחת) (צפופה)                 │
└─────────────────────────────────────────────┘
┌ נגישות ─────────────────────────────────────┐
│ אנימציות     (לפי המכשיר) (צמצום תנועה)        │
└─────────────────────────────────────────────┘
┌ כללי ───────────────────────────────────────┐
│ מסך פתיחה    (לוח בקרה) (תנועות) (העלאת מסמכים) │
│ שפה          עברית · שפות נוספות בהמשך         │
└─────────────────────────────────────────────┘
[איפוס לברירת המחדל]
```

Each setting is a radio group (`fieldset` + `legend`) shown as option chips. A choice applies immediately; there is no save button. Reset shows the toast "ההגדרות אופסו".

## Settings

| Setting | Options | Default | Effect |
|---|---|---|---|
| Theme | system, light, dark | system | `data-theme` on `<html>`. "System" follows `prefers-color-scheme` and switches live. |
| Text size | small 14px, normal 16px, large 18px, extra large 20px | normal | `data-text-size` changes the root font size; all type is in `rem`, chart labels included. |
| Density | comfortable, compact | comfortable | `data-density="compact"` reduces spacing tokens `--sp-3` to `--sp-7` by 25%. |
| Motion | system, reduce | system | `data-motion="reduce"` turns off animations and transitions. "System" already honours `prefers-reduced-motion`. |
| Start page | dashboard, transactions, upload | dashboard | Where the app opens after sign-in. |
| Language | Hebrew only | Hebrew | Read-only in v0.1 (R-012). |

## Dark theme

Every colour is a token on `:root` in `styles.css`; no component uses a raw colour. The dark values are defined twice, under `@media (prefers-color-scheme: dark)` for `:root:not([data-theme="light"])` and under `:root[data-theme="dark"]`. The meaning colours (income, expense, verified, expected, estimate, low confidence) keep their hue with lighter text and darker tint backgrounds, for at least 4.5:1 contrast on `--bg-surface`. Member colours stay the same in both themes, with white text.

## Accessibility

- Radio groups are keyboard operable (arrow keys within a group), and the focus ring shows on the chip.
- Hints are linked with `aria-describedby`.
- The theme is applied before the first render, so the page doesn't flash the wrong theme.

## Not in v0.1 (ideas for later)

- Number format (show or hide agorot), week start, and a "hide amounts" privacy mode for showing the screen to others.
- Notification preferences (when notifications exist).
- Saving preferences to the user account.
