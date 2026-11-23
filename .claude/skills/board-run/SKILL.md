---
name: board-run
description: Run one pass over the GitHub Projects board: sample every status, dispatch the owning subagent for each task, write its documentation, advance the status per the SDLC, and report. Use when the user says run the board, continue the work, or invokes /board-run.
---

# הרצת הבורד

טוענים גם את gh-sync. הסוכן הראשי מתזמר, תתי-הסוכנים עושים.

## מחזור
1. **דגימה:** שאילתה לכל סטטוס לפי gh-sync. קח רק משימות שאין להן תווית agent פעילה.
2. **סדר עדיפות לטיפול:** קודם מה שקרוב לסיום (In Review, In Testing, In Development, Test Design, Analysis & Spec), ורק בסוף משיכה חדשה. כך ה-WIP לא גדל.
3. **משיכה:** אם יש מקום, העבר את הרשימה המוצעת של product-owner (הוא מקבל את ה-Backlog ואת מספר המשימות ב-Awaiting Approval) ומעביר את הנבחרות ל-Analysis & Spec.
4. **שליחה לסוכן:** לפי טבלת הסטטוסים ב-docs/sdlc/github-workflow.md. ב-Analysis & Spec: analyst, אחריו architect, ואחריו ux-designer אם יש UI. העבר לסוכן את תיאור המשימה, ההערות הקודמות והקבצים הרלוונטיים.
5. **תיעוד ומעבר:** כתוב את הדוח של הסוכן כתגובה בתבנית, ואז העבר סטטוס לפי הדוח (קדימה, אחורה או On Hold).
6. **עצירה:** כשמשימה מגיעה ל-Awaiting Approval, הצג לבעל הריפו את סיכום המשימה וחכה להחלטה. אל תמשיך להעביר אותה.

## מגבלות הרצה
- עד 5 משימות או 5 מעברים בהרצה אחת, ואז דיווח. אפשר להריץ שוב.
- עצור מיד אם: אין חיבור ל-gh, תתי-הסוכנים מחזירים דוח לא תקין, או נדרשת פעולה ידנית (פריסה, הרשאות, סודות, נתונים אמיתיים).
- עבודה נעשית ב-acceptEdits. בסשן שנוגע בתשתית, בהרשאות או בפריסה עוברים ל-default (R-014).

## סיכום בסוף
רשימה קצרה: מה הוזז ולאן, מה ממתין לך (Awaiting Approval עם קישורים), מה חסום ולמה, ומה נמשך מה-Backlog.

## הרצה רציפה
סשן Claude Code לא רץ מעצמו. ההרצה מתבצעת כשמפעילים את ה-Skill. אפשר לשקול בהמשך משימה מתוזמנת, אבל בנתונים אמיתיים ובלי בעל הריפו זמין זה לא מומלץ.
