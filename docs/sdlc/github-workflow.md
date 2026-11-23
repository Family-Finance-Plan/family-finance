# תהליך העבודה ב-GitHub

GitHub Issues ולוח GitHub Projects הם מקור האמת למשימות, סטטוס, גרסה והיסטוריית התיעוד.
הריפו הוא מקור האמת לאפיון, ל-ADR ולקוד. כל PR מקושר ל-Issue (`Closes #n`).
אין בקלוג נוסף בקבצים.

פרטי הריפו והלוח: `<OWNER>/<REPO>`, לוח מספר `<PROJECT_NUMBER>` (להשלים בהקמה).

## מיפוי מושגים
- **סטטוס:** שדה Status בלוח (Single select), עם אותם שמות ואותו סדר כמו בטבלה למטה.
- **Epic:** Issue עם תווית `epic`. משימות מקשרות אליו.
- **Task:** Issue רגיל, יחידה שנכנסת ל-PR אחד, עם קריטריוני קבלה ניתנים לבדיקה.
- **Sub-task:** Sub-issue של Task (נוצר על ידי הארכיטקט).
- **Bug:** Issue עם תווית `bug`.
- **גרסה:** Milestone. חובה לפני יציאה מ-Analysis & Spec.
- **Priority:** שדה Single select בלוח (P0, P1, P2, P3).
- **חסימה:** קישור "blocked by" של GitHub. אם לא זמין, שורה `Blocked by #n` בגוף ה-Issue.
- **תפיסה בידי סוכן:** תווית `agent-<role>` וכן הערה.

## סטטוסים, בעלים ומעברים

| סטטוס | סוכן אחראי | תנאי יציאה | יעד |
|---|---|---|---|
| Backlog | product-owner | נבחרה למשיכה לפי סדר גרסאות ועדיפות, וה-WIP מאפשר | Analysis & Spec |
| Analysis & Spec | analyst, אחריו architect, ואחריו ux-designer (אם יש UI) | תגובת אפיון, תגובת פיצוח עם Sub-issues, Milestone מוגדר | Test Design |
| Test Design | tester | תגובת תוכנית בדיקות לכל קריטריון קבלה | In Development |
| In Development | developer | PR פתוח (draft מותר), בדיקות יחידה עוברות | In Testing |
| In Testing | tester | בדיקות אינטגרציה ובידוד עוברות | In Review |
| In Review | reviewer | אין ממצא חוסם | Awaiting Approval |
| Awaiting Approval | בעל הריפו בלבד | החלטה שלך על ה-PR | Deploy Ready או חזרה |
| Deploy Ready | devops | ה-PR אושר על ידך, ורק אחרי הוראת פריסה מפורשת שלך | Deployed |
| On Hold | מי שחסם | נפתחה החסימה | הסטטוס שממנו הגיעה |

משמעות הסטטוסים האחרונים: Awaiting Approval = ה-PR מוכן לסקירתך. Deploy Ready = אישרת את ה-PR, והוא עוד לא מוזג. Deployed = ה-PR מוזג ל-main והפריסה ב-Render הושלמה, וה-Issue נסגר.

## חזרה אחורה
- In Testing נכשל: חזרה ל-In Development, עם שחזור בתגובה.
- In Review עם ממצא חוסם: חזרה ל-In Development, עם הממצאים בתגובה.
- דחייה שלך ב-Awaiting Approval: אתה בוחר יעד, אחד מ-Analysis & Spec, Test Design, In Development או On Hold, והסוכן מתעד את הסיבה שלך בתגובה.
- חסימה או החלטה שחסרה: On Hold, עם תגובה ששואלת שאלה מפורשת.

## משיכה מהבקלוג (product-owner)
1. מועמדות: Issues בסטטוס Backlog ללא חסימה פתוחה.
2. סדר: ה-Milestone הנמוך ביותר שטרם שוחרר קודם, ובתוכו לפי Priority.
3. WIP: אם יש 3 משימות או יותר ב-Awaiting Approval, לא מושכים חדשות. הצוואר בקבוק הוא זמן הסקירה שלך. המספר ניתן לשינוי.
4. משימה בלי Epic, Priority או הפניה לדרישות FR חוזרת לאנליסט להשלמה ולא נמשכת.

## איך הסוכנים עובדים מול GitHub
- הסוכן הראשי הוא היחיד שקורא וכותב ל-Issues וללוח, דרך `gh` (GitHub CLI). אין שרת MCP. תתי-הסוכנים מחזירים לו דוח: תגובה בתבנית, וסטטוס מומלץ.
- הסוכן הראשי כותב את התגובה, ומעביר סטטוס רק אחרי שהיא נכתבה.
- ההרצה: `/board-run`. פרטים ב-.claude/skills/board-run/SKILL.md ובפקודות ב-.claude/skills/gh-sync/SKILL.md.

## Awaiting Approval ואכיפת R-016
הסוכן הראשי מציג לך סיכום: קריטריוני קבלה, תוצאות בדיקות, ממצאי סקירה, קישור ל-PR. אתה עונה: אישור, או דחייה עם יעד והערה.

האכיפה האמיתית היא על המיזוג, לא על עמודת הלוח. לוח Projects לא מגביל מי מעביר לאיזה סטטוס. לכן:
- הגנת ענף על `main` (Ruleset): PR חובה, אישור אחד לפחות, CODEOWNERS עם בעל הריפו, בדיקות CI חובה. Render פורס רק מ-`main`.
- ב-GitHub מחבר ה-PR לא יכול לאשר אותו בעצמו. אם הסוכנים עובדים תחת החשבון שלך, לא תוכל לאשר את ה-PR שלהם. לכן צריך זהות נפרדת לסוכנים: חשבון בוט או GitHub App, עם טוקן ל-`gh` שאינו שלך.
- ללא זהות נפרדת, העברה ל-Deploy Ready ול-Deployed נשארת הנחיה בלבד.

## הקמה חד-פעמית (בעל הריפו)
1. ליצור לוח Projects ושדה Status עם הסטטוסים לעיל, שדה Priority, ולהוסיף את הריפו.
2. ליצור תוויות: `epic`, `bug`, `agent-analyst`, `agent-architect`, `agent-ux-designer`, `agent-developer`, `agent-tester`, `agent-reviewer`, `agent-devops`.
3. ליצור Milestones לגרסאות.
4. להתקין ולחבר את `gh` במחשב, עם הרשאת `project`. מומלץ לבדוק ב-`gh auth status`.
5. להקים זהות נפרדת לסוכנים והגנת ענף כמתואר למעלה.
6. להחליף את `<OWNER>/<REPO>` ו-`<PROJECT_NUMBER>` בקבצים.
