---
name: process-keeper
description: How to add, change or retire an SDLC rule, stage gate or agent responsibility. Use when the user says to add a rule, change a mandatory checkpoint, or reassign who is responsible for a step.
---

# עדכון תהליך ה-SDLC

## כשבעל הריפו מבקש "תוסיף כלל: ..., בשלב X, באחריות Y"
1. קבע מזהה חדש ב-docs/sdlc/rules.md (המספר הבא ברצף, R-0xx).
2. מלא: כלל, שלב, אחראי, אכיפה, נימוק, תאריך. Status is always `experimental` for a new rule (see rules.md for promotion to `established`).
3. אכיפה: אם הכלל קריטי, חייבת להיות אכיפה אוטומטית (בדיקה, CI, Hook או lint). אם אין, סמן "המלצה" והצע מה להקים.
4. עדכן את קובץ התת-סוכן של האחראי ב-.claude/agents/ אם הכלל משנה את עבודתו.
5. אם נדרש lint, בדיקה או Hook, צור משימה למפתח או ל-devops. אל תכתוב שהכלל נאכף לפני שהאכיפה קיימת.
6. הוסף שורה ל-docs/sdlc/process-changelog.md.
7. הצג לבעל הריפו את השינוי כ-diff וקבל אישור לפני merge.

## שינוי Gate או שלב
עדכן את הטבלה ב-docs/sdlc/process.md ואת הסעיף ב-CLAUDE.md אם העיקרון שם משתנה. CLAUDE.md נשאר מתחת ל-200 שורות. פירוט עובר לקבצי docs.

## הסרת כלל
כלל שלא נאכף שני מחזורים, או שאין לו נימוק, מוצע להסרה בסיכום איטרציה (שלב 8). הסרה בלי אישור בעל הריפו אסורה.

## בדיקת סבירות לפני הוספה
האם כבר קיים כלל דומה? האם הכלל סותר ADR? אם כן, עצור והצע ADR חדש.
