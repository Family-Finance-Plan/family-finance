---
name: gh-sync
description: How the main agent reads and updates the GitHub Issues and Projects board for Family Finance with the gh CLI: statuses, comment templates per role, claim protocol, and transition rules. Use whenever reading task state, writing task documentation or moving a task between statuses.
---

# סנכרון מול GitHub

הסוכן הראשי בלבד קורא וכותב. תתי-סוכנים מחזירים דוח. פרטי הזרימה: docs/sdlc/github-workflow.md.

## קריאת הבורד
פקודות `gh`:
- כל פריטי הלוח עם סטטוס: `gh project item-list 1 --owner <OWNER> --format json --limit 200`
- פרטי Issue כולל תגובות: `gh issue view <n> --repo <OWNER>/family-finance --comments --json title,body,labels,milestone,comments`
- מזהי שדות ואפשרויות: `gh project field-list 1 --owner <OWNER> --format json`
סדר Backlog: Milestone עולה, ואז Priority. את הסינון והמיון עושים על ה-JSON בקוד קצר, לא בעיניים.
אם `gh` לא מחובר או אין הרשאה, עצור ודווח. אל תנחש סטטוס.
הפקודות נכתבו ללא בדיקה מול חשבון אמיתי. בהרצה הראשונה לוודא שהן עובדות ולתקן כאן.

## תפיסת משימה (claim)
לפני עבודה: תגובה "[תפקיד] התחיל" ותווית `agent-<תפקיד>` (`gh issue edit <n> --add-label`). אם כבר קיימת תווית של תפקיד אחר, או של אותו תפקיד בהרצה פעילה, דלג. בסיום הסר את התווית.

## כלל מעבר
1. לוודא שתנאי היציאה בטבלת הסטטוסים מתקיימים.
2. לכתוב את התגובה בתבנית (`gh issue comment <n> --body-file`). רק אחריה להעביר סטטוס.
3. שינוי סטטוס: `gh project item-edit --id <item> --project-id <project> --field-id <status-field> --single-select-option-id <option>`.
   מזהים קבועים (לוודא מול `field-list` אם משהו נכשל): project-id `PVT_kwHOA3kjEs4Bs3Df`. Status `PVTSSF_lAHOA3kjEs4Bs3DfzhrDKUE`: Backlog `88522986`, Analysis & Spec `2727a1e9`, Test Design `81a23d2b`, In Development `04c0ade8`, In Testing `b5972992`, In Review `bcf239d8`, Awaiting Approval `94d16aaf`, Deploy Ready `4b0dab23`, Deployed `94f4f214`, On Hold `bc77dcaf`. Priority `PVTSSF_lAHOA3kjEs4Bs3DfzhrDKqQ`: P0 `d583d228`, P1 `1ede08f1`, P2 `7b441014`, P3 `2b6b65c7`.
4. Deploy Ready ו-Deployed רק עם אישור מפורש של בעל הריפו באותה שיחה (R-016), ובפועל רק אחרי שה-PR אושר על ידו. לעולם לא ביוזמת סוכן.
5. אם חסר מידע או החלטה: On Hold עם שאלה מפורשת.

## תבניות תגובה (כותרת אחידה, בעברית)
**אפיון (analyst):** רמת אפיון (טיוטה/מוכן), דרישות FR קשורות, קריטריוני קבלה, נקודות פתוחות, הצעה ל-Milestone.
**פיצוח (architect):** Sub-issues (נוצרים בנפרד ומקושרים), ADR רלוונטי, סיכונים.
**עיצוב (ux-designer):** קישור למפרט ב-docs/ux, מצבי מסך, הערות RTL.
**אפיון בדיקות (tester):** בדיקה לכל קריטריון קבלה, כולל בידוד Tenants אם רלוונטי.
**פיתוח (developer):** ענף, קישור ל-PR, מה נבנה, מה לא הושלם.
**בדיקות (tester):** תוצאות לכל בדיקה, כשלים עם שחזור.
**סקירה (reviewer):** ממצאים לפי חומרה (חוסם, חשוב, הערה), קובץ ושורה.
**אישור (בעל הריפו):** החלטה, יעד אם נדחה, ההערה שלו בניסוחו.

## חזרה אחורה
תמיד עם תגובה שמסבירה למה, וקישור לממצא. סוכן שמחזיר משימה לא מעביר אותה הלאה אחרי תיקון בעצמו.

## אסור
לשנות Priority או Milestone של משימה קיימת בלי אישור בעל הריפו. למחוק Issues, תגובות או ענפים. למזג PR. לכתוב סודות או נתוני משפחה אמיתיים ב-Issues.
