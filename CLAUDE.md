# Family Finance – הנחיות קבועות לסוכנים

פלטפורמת Web גנרית לניהול ותכנון פיננסי משפחתי. כל משק בית הוא Tenant מבודד.
המסמך הזה נטען בכל סשן, ולכן הוא קצר. פירוט נמצא ב-docs/ וב-.claude/skills/.

## מקורות אמת (לקרוא לפני עבודה)
- אפיון: docs/spec/ (כולל docs/spec/spec-corrections.md, שגובר על האפיון המקורי)
- החלטות ארכיטקטוניות: docs/adr/ (ADR-001 to ADR-010)
- תהליך ושערים: docs/sdlc/process.md ו-docs/sdlc/rules.md
- אם משהו לא מופיע בקבצים האלה, הוא לא הוחלט. לשאול, לא להמציא.

## עקרונות שאסור לעבור עליהם
1. פלטפורמה, לא פתרון למשפחה אחת. אין קוד, נתיב או קונפיגורציה ייחודיים למשפחה.
2. Tenant = קובץ SQLite נפרד. ה-Tenant נקבע מהסשן המאומת בלבד, אף פעם לא מפרמטר מהדפדפן (ADR-001, ADR-002).
3. גישה לנתונים רק דרך שכבת Repository. לוגיקה עסקית לא מייבאת את Kysely (ADR-006).
4. סכומים כמספר שלם ביחידות קטנות (אגורות). בלי floating point. תאריכים כמחרוזת ISO. מזהים UUID.
5. מודול הליבה (Cash Flow Core) מבוסס תדפיס בנק. מודול Card Insights נפרד, וקשר חד-כיווני: הוא לא מזין סכומי תזרים (ADR-004).
6. נתון עתידי מסומן תמיד: מאומת, צפוי או הערכה. אסור לערבב ביניהם. תחזית אינה הבטחה.
7. ערכי הכנסה והוצאה לא נדרסים. שומרים תאריך תוקף וערך קודם.
8. תנועה שחולצה לא נכנסת למערכת בלי אישור משתמש במסך האימות.
9. נתונים אמיתיים של משפחה לא עולים לסביבת Render עד שיש אימות וגיבוי לילי מוצפן לכל Tenant. עד אז נתוני דמה בלבד.
10. סודות רק במשתני סביבה. לעולם לא בריפו, בלוגים או בדוגמאות.

## Stack (ADR-005)
TypeScript מקצה לקצה, monorepo. Backend: NestJS. Frontend: React. נתונים: Kysely מעל SQLite.
אימות: Google OIDC (ADR-003). חילוץ מסמכים: Claude API מאחורי ממשק Provider אחד (ADR-008).
פריסה: Render עם דיסק קבוע, מופע יחיד (ADR-007).

## Language and RTL (R-026)
English is the default for everything: docs, ADRs, notes, code, comments, identifiers, commit messages, PR and Issue text, agent and skill files, and chat replies to the owner.
The only exception is end-user UI text: Hebrew, RTL, kept in locale/resource files and never hardcoded. Use CSS logical properties (margin-inline, padding-inline, etc.) from the start.
Existing Hebrew files are being translated in a separate PR; until then, new text is written in English.

## איך עובדים (פרטים ב-docs/sdlc/process.md)
- כל משימה עוברת שלבים לפי סדר, ובכל שלב יש Gate. לא מדלגים.
- הסוכן הראשי מתזמר ולא כותב קוד בעצמו. לכל תפקיד יש תת-סוכן ב-.claude/agents/.
- מצב עבודה: תכנון ב-plan mode. מימוש ב-acceptEdits. כל מה שנוגע ב-DB, בסודות, בהרשאות, בפריסה או בתשתית נשאר ב-default עם אישור ידני.
- כלל קריטי חייב אכיפה אוטומטית (בדיקה, CI או Hook). הנחיה בלבד היא המלצה.
- שינוי ארכיטקטוני = ADR חדש. שינוי בתהליך = עדכון docs/sdlc/rules.md דרך PR, באישור בעל התהליך.

## ניהול משימות (GitHub)
- GitHub Issues ולוח Projects הם מקור האמת למשימות, סטטוס וגרסה (Milestone). הסוכן הראשי קורא וכותב, תתי-סוכנים מחזירים דוח.
- No move to On Staging or Released without the owner's explicit approval. Agents merge a PR only through devops and only on the owner's explicit instruction; the owner may merge themselves. Only the owner publishes a Release (ADR-009). Work through `gh`.
- להרצת הבורד: /board-run. פרטים ב-docs/sdlc/github-workflow.md.

## הקמה פתוחה
- אם ב-docs/setup-checklist.md יש סעיף לא מסומן, להזכיר לבעל הריפו בתחילת הסשן ולעבור איתו על הרשימה שלב אחרי שלב. עד אז R-016 הוא הנחיה בלבד, ונתונים אמיתיים אסורים.

## בעל התהליך
בעל הריפו מאשר Gates, ADR ושינויי תהליך. בנקודות רגישות (אבטחה, הרשאות, נתונים אמיתיים) אין החלטה בלי אישורו.

## עדכון הנחיות
אם התבקשת להוסיף כלל: הוסף שורה ל-docs/sdlc/rules.md (מזהה, שלב, תפקיד אחראי, אכיפה, נימוק, תאריך), עדכן את התת-סוכן הרלוונטי ואת הבדיקה או ה-Hook אם נדרש, ורשום ב-docs/sdlc/process-changelog.md.
