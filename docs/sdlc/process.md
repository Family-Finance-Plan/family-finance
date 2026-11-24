# תהליך הפיתוח (SDLC)

בעל התהליך: בעל הריפו. הסוכן הראשי (Orchestrator) מתזמר ושומר על התהליך. כל כלל מפורט נמצא ב-rules.md.

Version: v0.1 (2026-11-24). The process has not yet been used on real work and is expected to change. Rules are tagged established or experimental in rules.md.

## שמונה שלבים, ובכל אחד Gate

| # | שלב | תפקיד אחראי (תת-סוכן) | מצב עבודה | Gate (תנאי יציאה) |
|---|---|---|---|---|
| 1 | אפיון וניתוח | analyst | plan | דרישות עם מזהה, עדיפות וקריטריוני קבלה. אין סתירה מול spec-corrections. אישור בעל הריפו |
| 2 | ארכיטקטורה ותכנון | architect | plan | ADR לכל החלטה ארכיטקטונית. תוכנית מימוש מפורקת למשימות. אישור בעל הריפו |
| 3 | UX/UI | ux-designer | plan, אחר כך acceptEdits | מסכים ב-RTL, מצבי שגיאה ומצבים ריקים, תיאום עם הדרישות. אישור בעל הריפו |
| 4 | פיתוח | developer | acceptEdits | בדיקות יחידה עוברות, strict mode, בלי עקיפת Repository, PR קטן וממוקד |
| 5 | בדיקות | tester | acceptEdits | בדיקות אינטגרציה ובידוד Tenants עוברות, כיסוי לקריטריוני הקבלה |
| 6 | סקירה ואבטחה | reviewer | default | סקירת קוד ואבטחה לפי הרשימה ב-rules.md. אישור ידני של בעל הריפו בנקודות רגישות |
| 7 | פריסה | devops | default | CI ירוק, גיבוי מוכח, אין סודות בריפו. Staging אחרי מיזוג באישור בעל הריפו. Production רק מ-tag ובאישור בעל הריפו ב-Environment (ADR-009) |
| 8 | תפעול ולמידה | orchestrator | plan | סיכום איטרציה, הצעות לשיפור התהליך, סקירת כללים שלא נאכפו |

## כללי תפעול
- אין מעבר לשלב הבא בלי Gate שעבר. הסוכן הראשי מתעד את תוצאת ה-Gate.
- כל תפקיד עובד בתת-סוכן מבודד עם הרשאות מינימליות. הסוכן הראשי לא כותב קוד.
- נקודות שתמיד דורשות אישור ידני של בעל הריפו: הרשאות, אימות, נתונים אמיתיים, סודות, פריסה, מחיקת נתונים, שינוי ADR.
- פיצ'ר מתחיל ב-plan mode. אחרי אישור תוכנית עוברים למימוש.
- Stage review (v0.1): after every gate passes, the orchestrator writes 2-3 lines on what worked and what got in the way, in the Issue comment that records the gate result. Any suggested rule or gate change goes to the owner as a PR. Stage 8 still holds the full iteration review.

## סדר עבודה מומלץ (MVP)
1. שלב 1: Tenancy, אימות, משק בית, קליטת מסמכים (העלאה, חילוץ, אימות, אישור), תנועות עם קטגוריות ותגיות, Dashboard בסיסי של נתוני עבר.
2. שלב 2: למידה מתיקונים, חד-פעמיות, אירועים עתידיים, Timeline עם תחזית בסיס.
3. שלב 3: נכסים, התחייבויות והון נטו.
4. שלב 4: תרחישים, What-If, תקציב מול ביצוע, תמיכה בהחלטות, Card Insights.

הערה: סדר השלבים הוא הצעה. לאשר ב-Gate של אפיון.

## ניהול משימות (GitHub)
- GitHub Issues ולוח Projects הם מקור האמת למשימות, סטטוס וגרסה (docs/sdlc/github-workflow.md). אין בקלוג בקבצים.
- הסוכן הראשי היחיד שקורא וכותב ללוח. תתי-סוכנים מחזירים דוח.
- אסור מעבר ל-On Staging או Released בלי אישור מפורש של בעל הריפו.
- מגבלות WIP לכל שלב (R-021) ומסלול Bug P0 (R-025): docs/sdlc/github-workflow.md.

## תיעוד: מי כותב מה (R-022)
| מסמך | סוג | אחראי | מתי |
|---|---|---|---|
| docs/spec/: אפיון חי, מה המערכת עושה בפועל | עסקי | analyst | בשלב 1, ומעדכן כשפיצ'ר מגיע ל-Released |
| Release notes ב-GitHub Release | עסקי | product-owner | לכל Milestone או גרסת תיקון |
| docs/adr/ | טכני | architect | לכל החלטה ארכיטקטונית (R-005) |
| docs/ux/ | עיצוב | ux-designer | בשלב 3 |
| README: הרצה מקומית, docs/architecture.md: סקירת מודולים ומודל נתונים | טכני | developer | באותו PR שמשנה אותם |
| API reference | טכני | נוצר אוטומטית מ-NestJS (OpenAPI) | בכל Build, לא נכתב ידנית |
| docs/runbook.md: פריסה, rollback, שחזור משפחה בודדת | תפעול | devops | עם כל שינוי בפריסה או בגיבוי |
| מדריך למשתמש | עסקי | נדחה | כשיהיו משתמשים אמיתיים |

האכיפה: סעיף "תיעוד" בתבנית ה-PR (.github/pull_request_template.md). reviewer מסמן תיעוד חסר כממצא חוסם.
- להרצת מחזור על הבורד: `/board-run`. טוענים גם את gh-sync.
