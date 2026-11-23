# ADR-009: סביבות וגרסאות (Staging ו-Production)

Status: Approved by the owner (2026-11-23). Extends ADR-007 and does not replace it. The items under "פתוח" stay open; they block only real data in Production. Amended 2026-11-23 (approved by the owner): enforcement uses a public repo instead of GitHub Pro; see Decision.

## הקשר
ADR-007 מגדיר את Render כסביבת פיתוח ובדיקות בלבד. בעל התהליך צריך שליטה במה שמגיע לגרסה החיה, גם בתיקוני באגים וגם בפיצ'רים, בלי שכל מיזוג ל-`main` יגיע ללקוחות.

## החלטה
- שתי סביבות ב-Render, כל אחת שירות נפרד עם דיסק קבוע משלה:
  - **Staging:** פריסה אוטומטית בכל מיזוג ל-`main`. נתוני דמה בלבד, תמיד.
  - **Production:** פריסה אוטומטית כבויה. פריסה רק מ-tag של גרסה (semver `vX.Y.Z`), דרך workflow ב-GitHub Actions שמופעל מ-tag.
- **מי מאשר:** בעל הריפו בלבד יוצר tag של גרסה, כשהוא מפרסם GitHub Release. יצירת ה-tag היא האישור לפריסה.
  - Enforcement: the `protect-releases` tag ruleset on `v*` restricts creation, update and deletion; only the Repository admin role (the owner) bypasses it. Active since 2026-11-23.
  - The repo was made public on 2026-11-23 instead of paying for GitHub Pro, because rulesets are free on public repos. A full scan of history, branches, issues and PRs found no secrets or family data; only commit author emails are exposed. Real family data and secrets must never be committed.
  - חלופה שנבדקה: required reviewers על GitHub Environment. זמין בריפו פרטי רק ב-Enterprise, ולכן לא נבחר.
- זרימת גרסה: פיצ'רים מצטברים ב-Milestone ומאומתים ב-Staging. כשה-Milestone הושלם, devops מכין טיוטת GitHub Release עם release notes של product-owner. בעל הריפו מפרסם אותה, וזה יוצר את ה-tag ומפעיל את הפריסה.
- באגים: באג רגיל נכנס לגרסה הבאה. באג P0 מקבל מסלול מהיר: קופץ בתור הבקלוג, לא מדלג על אף Gate, ויוצא כ-patch (`vX.Y.Z+1`) דרך אותו אישור Production.
- סטטוסים בלוח: Deploy Ready ו-Deployed מוחלפים ב-**On Staging** (ה-PR מוזג ל-`main` ונפרס ל-Staging) וב-**Released** (נכלל בגרסה שחיה ב-Production, וה-Issue נסגר).

## כללים
1. Production נשאר על נתוני דמה עד שתנאי R-006 מתקיימים (אימות וגיבוי לילי מוצפן לכל Tenant).
2. לפני כל פריסה ל-Production: גיבוי אוטומטי של כל קובץ Tenant ברמת האפליקציה (לא snapshot הדיסק של Render).
3. Rollback = פריסה מחדש של ה-tag הקודם. אם migration אינו הפיך, משחזרים את גיבויי ה-Tenants.
4. Migrations תואמים קדימה ורצים לכל Tenant בטרנזקציה נפרדת (ADR-001, ADR-006).
5. סודות כל סביבה (כולל מפתח הפריסה ל-Production) כמשתני סביבה וכסודות ב-GitHub Actions, לא בריפו (R-007).

## השלכות
- שירות Render שני עם דיסק מוסיף עלות חודשית.
- **Provisioning (approved in principle only, 2026-11-23):** nothing is provisioned now. Staging is created together with the first deploy. Production is created only when the first release is close. A persistent disk requires a paid instance (not the Free instance), so before creating either service, devops checks Render's current instance and disk pricing and presents it to the owner for approval.
- Deployment control: the `protect-main` ruleset with CODEOWNERS (R-016) controls what reaches Staging, and the `protect-releases` tag ruleset (R-023) controls what reaches Production. Both are enforced since 2026-11-23, with the agents working as the bot account. Required CI checks are added to `protect-main` once CI exists.
- התהליך מתארך: מיזוג אינו שחרור, ו-Issue נשאר פתוח עד Released.

## חלופות שנדחו
סביבה אחת עם פריסה ידנית מ-`main` (אין מקום לאימות לפני לקוחות). פריסה רציפה ל-Production בכל מיזוג (אין שליטה על תזמון ותוכן הגרסה). ענף `release` נפרד במקום tags (יותר ענפים לתחזק, אותה שליטה). GitHub Pro on a private repo (monthly cost; The owner chose a public repo instead, 2026-11-23).

## פתוח
- אזור הפריסה וסוגיית הפרטיות מול גורם משפטי (ADR-007, כלל 4). חוסם נתונים אמיתיים ב-Production.
- מדיניות חלון השבתה לפריסות Production (הדיסק מונע פריסה בלי השבתה, ADR-007).
- האם נדרשים feature flags.

## תנאי לחזרה להחלטה
צורך בפריסה בלי השבתה, יותר ממופע אחד, מעבר למסד משותף, או קצב תיקוני P0 שמצדיק מסלול נפרד.
