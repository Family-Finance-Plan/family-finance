# תיקוני אפיון והחלטות שנוספו אחרי האפיון המקורי

מסמך זה גובר על האפיון המקורי (spec-original.md) כשיש סתירה.

## א. החלטות שהתקבלו אחרי כתיבת האפיון
- ARCH-07, ARCH-08, ARCH-09: ראו ADR-001 עד ADR-008.
- INT-04: Claude הוא ספק ה-AI (ADR-008). INT-03: אין ספק OCR נפרד בשלב ראשון.
- INT-06: אימות עם Google (ADR-003).
- מקור הנתונים הראשי: תדפיס בנק. פירוט אשראי הוא מודול נפרד אופציונלי (ADR-004).
- משתמש שייך למשק בית אחד בלבד כרגע (ADR-002).
- קבצים לכל Tenant (SQLite) במקום מסד משותף בשלב ראשון (ADR-001).

## ב. סתירות ופערים שזוהו, עם הצעה
| נושא | בעיה | הצעה | סטטוס |
|---|---|---|---|
| Excel | סעיף 13 מזכיר Excel, FR-08 מונה רק PDF, CSV ותמונות | להוסיף XLSX ל-FR-08 או להחליט במפורש שלא | Decided 2026-11-23: XLSX supported in v0.1 (section ה, D1) |
| שכפול מול Multi-Tenancy | FR-05 מדבר על שכפול התקנה, ARCH-02 על מערכת אחת עם משקי בית | יושב ב-ADR-001: Tenant הוא קובץ, יצירת משפחה חדשה היא יצירת קובץ | נסגר |
| סוג תנועה | FR-60 מכיר רק הכנסה והוצאה, אך FR-100 קובע שהעברה אינה הוצאה | להוסיף סוג שלישי "העברה", גם אם הזיהוי האוטומטי יגיע אחר כך | Decided 2026-11-23: third type "transfer", marked by hand in v0.1 (D4) |
| שלוש טקסונומיות של ודאות | ביטחון חילוץ, סטטוס אירוע, סוג תחזית | ביטחון חילוץ = תכונת תנועה. סטטוס (מאומת/צפוי/הערכה) = תכונת אירוע. סוג תחזית = סינון לפי סטטוס. תרחישים = שכבת What-If מעל התחזית | מוצע |
| ציר Y בגרף | לא הוגדר | יתרה נזילה בגרף הראשי. הון נטו כשכבה נפרדת (FR-102) | מוצע |
| כפילויות בדרישות | FR-16 עד FR-19 חוזרות ב-FR-29 עד FR-32. FR-47 מכפיל את FR-19 | לאחד בשלב האפיון המחודש | מוצע |
| תלות בתקציב | FR-50 ו-FR-114 תלויים במודול תקציב שנדחה | לסמן כשלב 4 | מוצע |
| עדיפויות | אין עדיפויות כלל, ולכן אי אפשר לתכנן MVP | לתעדף בשלב 1 של התהליך | Decided 2026-11-23: v0.1 = MVP phase 1; priorities are set per GitHub Issue (D14) |
| פריטי [הנחה] | רשימות הקטגוריות, שלוש התחזיות, ניתוח רכישת דירה הם הצעות של ChatGPT ולא החלטות | לאשר או לדחות פריט פריט | פתוח |

## ג. שינויים באפיון בעקבות ADR-004
- ישות חדשה: CardTransaction, נפרדת מ-Transaction.
- סטטוס "חיוב אשראי לא מפורט" לשורה בתדפיס הבנק.
- FR-97 עד FR-103 וה-Dashboard מתייחסים למודול הליבה בלבד.
- שלוש דרישות חדשות למודול Card Insights: קישור רך לחיוב בבנק, מדד כיסוי לכל תצוגת קטגוריות, ומדד שלמות נתונים לכל חודש.

## ד. נושאים שעדיין פתוחים
Updated 2026-11-23: the permission matrix, file size and source retention, the duplicate rule, deletion, currency and extraction approval are decided for v0.1 (section ה). Still open: notifications, export, regulation and privacy (legal review and hosting region), numeric extraction confidence thresholds, permanent deletion and retention policy, Render pricing and backup storage.

## ה. Decisions for v0.1 (owner, 2026-11-23)
| # | Topic | Decision |
|---|---|---|
| D14 | v0.1 scope | v0.1 = MVP phase 1 from process.md: tenancy, Google login, household, document intake (upload, extraction, review, approval), transactions with categories and tags, basic past-data dashboard |
| D1 | File types | PDF, CSV, images and Excel (XLSX). Extends FR-08 |
| D7 | Currency | All currencies. A row with no currency indication defaults to ILS. Totals are in ILS, using the amount the bank actually charged; the original currency and amount are kept and shown |
| D9 | Members and users | Only people who use the app sign in. Other members (for example children) are labels for tagging, with no login |
| D2 | Transaction type | Income, expense and transfer. Transfers are marked by hand in v0.1 and are excluded from income and expense totals. Automatic detection comes later |
| D3 | Permissions (FR-06, v0.1) | Admin: everything, including inviting and removing users. Partner: view, upload, approve and edit, but not manage users. Limited: view only |
| D4 | Approval (FR-20, FR-24) | Every extracted row needs user approval in v0.1. Low-confidence fields are highlighted. Numeric thresholds are set later from the test set |
| D5 | Unreadable documents (FR-26) | Shown as failed with a plain reason, kept in upload history, nothing imported. The user can retry or enter rows by hand |
| D6 | Duplicates (FR-11) | Same file content: warning before extraction. Same date, amount, direction and description: flagged as a possible duplicate for the user to decide. Nothing is deleted automatically |
| D8 | Default categories | The draft category list in spec-original is the editable default for new households |
| D10 | File limits | 10 MB per file. The original is kept in the household's own folder until a retention policy is decided |
| D11 | Deleting a transaction | Recoverable delete (hidden, with undo). Permanent deletion is decided later |
| D12 | First dashboard chart | Monthly income vs expense bars for past months. A balance line comes later |
| D13 | Category suggestion | Extraction suggests a category per row, and the user confirms or changes it on the review screen. No learning from corrections in v0.1 |
| D16 | Test statements | The owner supplies the examples. They must be synthetic or fully redacted, because the repo is public |
| D15 | Hosting cost and backup storage | Open. Devops presents prices before Staging and backups are built (ADR-009) |
