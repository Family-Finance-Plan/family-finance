---
name: tenancy-standards
description: Multi-tenant standards for Family Finance: tenant resolution from session, one SQLite file per household, repository access, isolation tests, money and date conventions. Use when touching data access, auth, migrations, or anything that crosses tenants.
---

# תקני Multi-Tenancy

## הקצאת Tenant
1. Control Plane (מאגר מרכזי נפרד) מחזיק משתמשים, שיוך למשק בית ותפקיד. ללא נתוני תנועות.
2. בכניסה: אימות Google (sub יציב), חיפוש משתמש ב-Control Plane, קביעת tenantId, שמירה בסשן.
3. כל בקשה: ה-Guard מוציא tenantId מהסשן. אין קריאה של tenantId מ-URL, גוף בקשה או header.
4. ה-TenantContext מועבר לשכבת הגישה לנתונים, והיא היחידה שמקבלת נתיב קובץ.

## שכבת הגישה לנתונים
- ממשקי Repository (למשל TransactionRepository) הם החוזה. המימוש היחיד כרגע: Kysely מעל SQLite.
- חיבור לקובץ Tenant נפתח לפי tenantId שאומת, נשמר ב-cache מוגבל, ונסגר בתום השימוש.
- tenant_id קיים בכל טבלה גם כשיש קובץ נפרד, ובכל שאילתה כתנאי נוסף (הגנה בעומק).

## Migrations
- קבצי migration עם תאריך ISO בשם. רצים על כל קובץ Tenant דרך Migrator.
- Migration שנכשל באמצע: ממשיכים לשאר ה-Tenants, מדווחים, ולא משאירים Tenant במצב חצוי (טרנזקציה לכל Tenant).
- לפני migration הרסני: גיבוי של הקובץ.

## מוסכמות נתונים
- סכום: מספר שלם ביחידות קטנות (אגורות) + שדה מטבע.
- תאריך: מחרוזת ISO. עמודת period (למשל "2026-11") כשדה רגיל.
- מזהה: UUID בטקסט.
- ערכים בני תוקף: effective_from, effective_to, previous_value, source, certainty, note.
- certainty של נתון עתידי: verified, expected, estimate בלבד.

## בדיקת בידוד (חובה בכל Build)
1. יוצרים שני Tenants עם נתוני דמה שונים.
2. מבצעים כל נקודת קצה עם סשן של Tenant א' ומנסים לבקש מזהי משאבים של Tenant ב' (ברמת URL, גוף ופרמטרים).
3. מצופה: 403 או 404, ושום נתון של Tenant ב' בתגובה, בלוג או בהודעת שגיאה.
4. בדיקה נוספת: סשן בלי Tenant נדחה.

## אסור
פתיחת קובץ SQLite מחוץ לשכבת הגישה. הסקת Tenant משם קובץ או משדה שהמשתמש שולט בו. מיזוג נתונים בין Tenants בקוד אפליקציה.
