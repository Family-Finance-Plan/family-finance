---
name: board-run
description: Run one pass over the GitHub Projects board: sample every status, dispatch the owning subagent for each task, write its documentation, advance the status per the SDLC, and report. Use when the user says run the board, continue the work, or invokes /board-run.
---

# הרצת הבורד

טוענים גם את gh-sync. הסוכן הראשי מתזמר, תתי-הסוכנים עושים.

## מחזור
1. **דגימה:** שאילתה לכל סטטוס לפי gh-sync. קח רק משימות שאין להן תווית agent פעילה.
2. **סדר עדיפות לטיפול:** קודם Bug P0 בכל שלב (R-025), ואז מה שקרוב לסיום (In Review, In Testing, In Development, Ready for Dev, Test Design, Analysis & Spec), ורק בסוף משיכה חדשה. כך ה-WIP לא גדל.
3. **WIP (R-021):** לפני כל מעבר קדימה, ספור את סטטוס היעד. In Development ו-In Testing עד 2, Awaiting Approval עד 3. אם היעד מלא, המשימה נשארת: מ-Test Design עוברים ל-Ready for Dev, ובשאר השלבים נשארים בלי תווית agent. Bug P0 עוקף את המגבלה.
4. **משיכה:** אם יש מקום, העבר את הרשימה המוצעת של product-owner (הוא מקבל את ה-Backlog ואת מספר המשימות ב-Awaiting Approval) ומעביר את הנבחרות ל-Analysis & Spec.
5. **שליחה לסוכן:** לפי טבלת הסטטוסים ב-docs/sdlc/github-workflow.md. ב-Analysis & Spec: analyst, אחריו architect, ואחריו ux-designer אם יש UI. העבר לסוכן את תיאור המשימה, ההערות הקודמות והקבצים הרלוונטיים.
6. **תיעוד ומעבר:** כתוב את הדוח של הסוכן כתגובה בתבנית, ואז העבר סטטוס לפי הדוח (קדימה, אחורה או On Hold).
7. **עצירה:** כשמשימה מגיעה ל-Awaiting Approval, הצג לבעל הריפו את סיכום המשימה וחכה להחלטה. אל תמשיך להעביר אותה. On Staging ו-Released רק בהוראה מפורשת של בעל הריפו (R-016, ADR-009).
8. **Release:** אם כל משימות ה-Milestone ב-On Staging, דווח לבעל הריפו שה-Milestone מוכן ל-Release. בהוראתו, devops מכין טיוטה. רק בעל הריפו מפרסם ויוצר את ה-tag (R-023).

## מגבלות הרצה
- עד 5 משימות או 5 מעברים בהרצה אחת, ואז דיווח. אפשר להריץ שוב.
- עצור מיד אם: אין חיבור ל-gh, תתי-הסוכנים מחזירים דוח לא תקין, או נדרשת פעולה ידנית (פריסה, הרשאות, סודות, נתונים אמיתיים).
- עבודה נעשית ב-acceptEdits. בסשן שנוגע בתשתית, בהרשאות או בפריסה עוברים ל-default (R-014).

## סיכום בסוף
רשימה קצרה: מה הוזז ולאן, מה ממתין לך (Awaiting Approval עם קישורים), מה חסום ולמה, ומה נמשך מה-Backlog.

## הרצה רציפה
סשן Claude Code לא רץ מעצמו. ההרצה מתבצעת כשמפעילים את ה-Skill. אפשר לשקול בהמשך משימה מתוזמנת, אבל בנתונים אמיתיים ובלי בעל הריפו זמין זה לא מומלץ.
