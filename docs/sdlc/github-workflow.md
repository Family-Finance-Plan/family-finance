# תהליך העבודה ב-GitHub

GitHub Issues ולוח GitHub Projects הם מקור האמת למשימות, סטטוס, גרסה והיסטוריית התיעוד.
הריפו הוא מקור האמת לאפיון, ל-ADR ולקוד. כל PR מקושר ל-Issue (`Refs #n`, לא `Closes #n`: מיזוג הוא רק On Staging, וה-Issue נסגר ב-Released על ידי הסוכן הראשי).
אין בקלוג נוסף בקבצים.

פרטי הריפו והלוח: `<OWNER>/family-finance`, לוח מספר `1` (https://github.com/users/<OWNER>/projects/1).

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
| Test Design | tester | תגובת תוכנית בדיקות לכל קריטריון קבלה | Ready for Dev |
| Ready for Dev | תור, אין בעלים | יש מקום ב-In Development לפי WIP | In Development |
| In Development | developer | PR פתוח (draft מותר), בדיקות יחידה עוברות, תיעוד עודכן אם ההתנהגות השתנתה | In Testing |
| In Testing | tester | בדיקות אינטגרציה ובידוד עוברות | In Review |
| In Review | reviewer | אין ממצא חוסם (כולל תיעוד חסר) | Awaiting Approval |
| Awaiting Approval | בעל הריפו בלבד | אישרת את ה-PR, ו-devops מיזג אותו להוראתך המפורשת | On Staging או חזרה |
| On Staging | devops | ה-Milestone הושלם, אישרת Release, ואישרת את הפריסה ב-GitHub Environment `production` | Released |
| Released | אין | מצב סופי: ה-Issue סגור והגרסה חיה ב-Production | אין |
| On Hold | מי שחסם | נפתחה החסימה | הסטטוס שממנו הגיעה |

משמעות הסטטוסים האחרונים: Awaiting Approval = ה-PR מוכן לסקירתך. On Staging = ה-PR מוזג ל-main ונפרס אוטומטית ל-Staging, וממתין ל-Release. Released = נכלל בגרסה (tag) שנפרסה ל-Production. סביבות וגרסאות: ADR-009.

## מגבלות WIP (R-021)
| סטטוס | מקסימום משימות |
|---|---|
| In Development | 2 |
| In Testing | 2 |
| Awaiting Approval | 3 (אם מלא, לא מושכים מה-Backlog) |

משימה שסיימה שלב והשלב הבא מלא נשארת בתור: Ready for Dev לפני פיתוח. בשאר השלבים התור הוא הסטטוס הבא בלי תווית `agent-<role>`: תווית קיימת = בעבודה, אין תווית = ממתינה. המספרים ניתנים לשינוי באישור בעל הריפו.

## Bugs ו-Releases (ADR-009)
- **פיצ'רים:** מצטברים ב-Milestone ונבדקים ב-Staging. כשה-Milestone הושלם, אתה מאשר Release, devops יוצר tag (`vX.Y.Z`) ו-GitHub Release עם release notes של product-owner, והפריסה ל-Production ממתינה לאישור שלך ב-Environment.
- **Bug רגיל:** נכנס ל-Release הבא.
- **Bug P0:** מסלול מהיר. עוקף את התור ואת מגבלות ה-WIP, אבל לא מדלג על אף Gate. יוצא כגרסת תיקון (`vX.Y.Z+1`) באותו אישור Production.

## חזרה אחורה
- In Testing נכשל: חזרה ל-In Development, עם שחזור בתגובה.
- In Review עם ממצא חוסם: חזרה ל-In Development, עם הממצאים בתגובה.
- דחייה שלך ב-Awaiting Approval: אתה בוחר יעד, אחד מ-Analysis & Spec, Test Design, In Development או On Hold, והסוכן מתעד את הסיבה שלך בתגובה.
- חסימה או החלטה שחסרה: On Hold, עם תגובה ששואלת שאלה מפורשת.

## משיכה מהבקלוג (product-owner)
1. מועמדות: Issues בסטטוס Backlog ללא חסימה פתוחה.
2. סדר: ה-Milestone הנמוך ביותר שטרם שוחרר קודם, ובתוכו לפי Priority.
3. WIP: אם Awaiting Approval מלא (3), לא מושכים חדשות. הצוואר בקבוק הוא זמן הסקירה שלך. שאר המגבלות בטבלת ה-WIP למעלה.
4. משימה בלי Epic, Priority או הפניה לדרישות FR חוזרת לאנליסט להשלמה ולא נמשכת.

## איך הסוכנים עובדים מול GitHub
- הסוכן הראשי הוא היחיד שקורא וכותב ל-Issues וללוח, דרך `gh` (GitHub CLI). אין שרת MCP. תתי-הסוכנים מחזירים לו דוח: תגובה בתבנית, וסטטוס מומלץ.
- הסוכן הראשי כותב את התגובה, ומעביר סטטוס רק אחרי שהיא נכתבה.
- ההרצה: `/board-run`. פרטים ב-.claude/skills/board-run/SKILL.md ובפקודות ב-.claude/skills/gh-sync/SKILL.md.

## Awaiting Approval ואכיפת R-016
הסוכן הראשי מציג לך סיכום: קריטריוני קבלה, תוצאות בדיקות, ממצאי סקירה, קישור ל-PR. אתה עונה: אישור, או דחייה עם יעד והערה.

האכיפה האמיתית היא על המיזוג, לא על עמודת הלוח. לוח Projects לא מגביל מי מעביר לאיזה סטטוס. לכן:
- הגנת ענף על `main` (Ruleset): PR חובה, אישור אחד לפחות, CODEOWNERS עם בעל הריפו, בדיקות CI חובה. Staging ב-Render פורס רק מ-`main`.
- Production פורס רק מ-tag, דרך GitHub Environment `production` שהמאשר הנדרש בו הוא בעל הריפו (R-023).
- ב-GitHub מחבר ה-PR לא יכול לאשר אותו בעצמו. אם הסוכנים עובדים תחת החשבון שלך, לא תוכל לאשר את ה-PR שלהם. לכן צריך זהות נפרדת לסוכנים: חשבון בוט או GitHub App, עם טוקן ל-`gh` שאינו שלך.
- ללא זהות נפרדת, העברה ל-On Staging ול-Released נשארת הנחיה בלבד.

## הקמה חד-פעמית (בעל הריפו)
1. ליצור לוח Projects ושדה Status עם הסטטוסים לעיל, שדה Priority, ולהוסיף את הריפו.
2. ליצור תוויות: `epic`, `bug`, `agent-analyst`, `agent-architect`, `agent-ux-designer`, `agent-developer`, `agent-tester`, `agent-reviewer`, `agent-devops`.
3. ליצור Milestones לגרסאות.
4. להתקין ולחבר את `gh` במחשב, עם הרשאת `project`. מומלץ לבדוק ב-`gh auth status`.
5. להקים זהות נפרדת לסוכנים והגנת ענף כמתואר למעלה.
5א. להקים GitHub Environment `production` עם בעל הריפו כמאשר נדרש, ושני שירותי Render (Staging ו-Production) לפי ADR-009.
6. ~~להחליף את placeholders של הריפו והלוח בקבצים.~~ בוצע 2026-11-23.
