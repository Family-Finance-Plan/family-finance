# רשימת הקמה: לעבור עם בעל הריפו לפני העבודה האמיתית הראשונה

## הנחיה ל-Claude Code
בתחילת כל סשן, כל עוד יש כאן סעיף שלא סומן [x], להזכיר לבעל הריפו בשורה אחת שהרשימה הזו עדיין פתוחה. כשבעל הריפו מוכן, לעבור איתו על הסעיפים שלב אחרי שלב, אחד בכל פעם, ולהסביר בפשטות מה עושים ולמה. בעל הריפו ביקש במפורש שתעבור איתו על זה, כי ההסבר הראשוני בשיחה היה מבלבל. לסמן [x] רק אחרי שבעל הריפו אישר שהסעיף בוצע. אסור לבקש מבעל הריפו להדביק טוקן או סיסמה בשיחה.

## מה ולמה
ב-GitHub אי אפשר לאשר PR שכתבת בעצמך. אם הסוכנים עובדים תחת החשבון של בעל הריפו, הוא לא יוכל לאשר את העבודה שלהם, ואי אפשר לאכוף את הכלל R-016 שרק הוא מאשר. לכן הסוכנים צריכים זהות נפרדת, והענף הראשי צריך הגנה. עד שזה מוקם, R-016 הוא הנחיה בלבד, ואסור להעלות נתונים אמיתיים.

## זהות נפרדת לסוכנים (החלטה: חשבון GitHub נוסף, לא מנוי Claude נוסף)
- [x] ללמוד את תנאי השימוש של GitHub לגבי חשבון לאוטומציה, ולוודא שחשבון בוט מותר. אם יש ספק, חלופה: GitHub App. Done 2026-11-23: GitHub ToS allows one machine account per person.
- [x] ליצור חשבון בוט עם מייל נפרד ושם שמסביר מה הוא (שם הפרויקט עם bot). Done 2026-11-23: the bot account.
- [x] סיסמה חזקה וייחודית, ואימות דו-שלבי. Done 2026-11-23.
- [x] להזמין אותו לריפו כ-Collaborator עם הרשאת Write בלבד. לא Admin. Done 2026-11-23: invite accepted, permission `write` (personal-account repos have a single collaborator level, no admin).
- [x] ליצור טוקן fine-grained מוגבל לריפו הזה, עם תפוגה קצרה (למשל 90 יום): קריאה וכתיבה לתוכן, ל-Pull requests ול-Issues, והרשאה ללוח Projects. את הדרך המדויקת להרשאת Projects לבדוק בתיעוד של GitHub בזמן ההקמה. Done 2026-11-23 with a deviation: a **classic** token (scopes `repo`, `project`, 90 days), verified with gh (viewerPermission WRITE). A classic `repo` token reaches every repo the bot can access, so the bot must stay a collaborator on this repo only. Set a reminder to rotate it before it expires.
- [ ] לשמור את הטוקן כמשתנה סביבה במחשב. לא בריפו, לא בלוגים ולא בשיחה.
- [ ] לוודא ש-`gh auth status` מציג את הבוט, ולא את החשבון של בעל הריפו. (2026-11-23: on this machine gh is still active as `Agranacg`.)
- [ ] Bot git identity: commits made by the agents are authored as the bot account (git `user.name` and the bot's GitHub noreply email), not as the owner.
- [ ] Bot access to the Projects board: add the bot account with Write in board Settings → Manage access, and verify the bot token can read and edit items.

## הגנה על הענף הראשי (זה מה שבפועל אוכף את R-016)
- [x] להחליט איך נאכף אישור Production. הוחלט (2026-11-23): להישאר כרגע ב-GitHub Free. required reviewers על Environment לא זמין בריפו פרטי, ולכן האכיפה תהיה Tag ruleset (R-023, ADR-009).
- [ ] **לשדרג ל-GitHub Pro ולהקים Tag ruleset על `v*` שרק בעל הריפו יכול ליצור. חובה לפני נתונים אמיתיים, או לפני שסוכנים מתחילים לפתוח PR מול `main`, לפי מה שקודם.** Pro נדרש גם ל-Ruleset על `main` שבסעיף הבא.
- [ ] Ruleset על `main`: PR חובה, אישור אחד לפחות, בדיקות CI חובה, וחסימת דחיפה ישירה.
- [ ] קובץ CODEOWNERS שמחייב את האישור של בעל הריפו.
- [ ] לוודא שהבוט לא ברשימת העוקפים של ה-Ruleset, ושגם בעל הריפו כמנהל לא עוקף בטעות.
- [ ] לבדוק בפועל: הבוט פותח PR, מנסה למזג בלי אישור, וההתנסות נחסמת.
- [ ] Render מוגדר לפרוס רק מ-`main`.

## לוח ותשתית
- [x] ליצור ריפו ולוח Projects, ולמלא `<OWNER>/<REPO>` ו-`<PROJECT_NUMBER>` בקבצים. השמות עדיין לא קיימים ובעל הריפו יספק אותם.
- [x] שדה Status עם הסטטוסים ב-docs/sdlc/github-workflow.md, שדה Priority, תוויות ו-Milestones.
- [ ] בהרצה הראשונה של /board-run לוודא שפקודות `gh` ב-gh-sync עובדות, ולתקן את מה שלא.

## ממתין להחלטת בעל הריפו
- [ ] Excel כקלט, סוג תנועה "העברה", עדיפויות לדרישות (docs/spec/spec-corrections.md, סעיף ד').
- [ ] האם process.md הוא גרסה v0.1 עם סקירה חובה אחרי כל שלב, ותיוג כללים כמבוססים או ניסיוניים.
- [ ] מאגר בדיקה של דפי בנק לחילוץ (R-013), מי מכין אותו.
