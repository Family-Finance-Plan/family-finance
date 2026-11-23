# ADR-005: Tech Stack

סטטוס: אושר

## החלטה
TypeScript מקצה לקצה ב-monorepo אחד.
- Backend: NestJS (מבנה מודולרי שמתאים ל-ADR-002 ו-ADR-004).
- Frontend: React עם TypeScript. גרפים וטבלאות ל-Dashboard ול-Timeline. RTL עם CSS logical properties.
- חוזה API מוקלד שמשותף ל-Frontend ול-Backend. שינוי בחוזה שובר את ה-Build.
- צנרת ה-AI באותה שפה, בלי Python.

## השלכות
שפה אחת לכל המערכת. נדרשת משמעת בבדיקות ובטיפוסים (strict mode).

## חלופות שנדחו
Microsoft: .NET ו-Angular.

## תנאי לחזרה להחלטה
צורך בספרייה או במנוע חישוב שקיימים רק בשפה אחרת.
