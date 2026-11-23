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
- [x] לשמור את הטוקן כמשתנה סביבה במחשב. לא בריפו, לא בלוגים ולא בשיחה. Done 2026-11-23: saved as the user environment variable `GH_TOKEN`.
- [x] לוודא ש-`gh auth status` מציג את הבוט, ולא את החשבון של בעל הריפו. Done 2026-11-23: `gh api user` returns the bot account.
- [x] Bot git identity: commits made by the agents are authored as the bot account (git `user.name` and the bot's GitHub noreply email), not as the owner. Done 2026-11-23: set in this repo's local git config (the bot's GitHub noreply address).
- [x] Bot access to the Projects board: add the bot account with Write in board Settings → Manage access, and verify the bot token can read and edit items. Done 2026-11-23: GraphQL as the bot reads the board and returns `viewerCanUpdate: true`. Note: `gh project ...` commands fail with "unknown owner type" under this token; see the /board-run item below.

## הגנה על הענף הראשי (זה מה שבפועל אוכף את R-016)
- [x] להחליט איך נאכף אישור Production. הוחלט (2026-11-23): להישאר כרגע ב-GitHub Free. required reviewers על Environment לא זמין בריפו פרטי, ולכן האכיפה תהיה Tag ruleset (R-023, ADR-009).
- [ ] (2026-11-23: The owner chose not to pay for Pro. The repo was made public instead, which gives rulesets for free; a deep scan found no secrets or family data, only the owner's commit email. Still open: the Tag ruleset on `v*`.) **לשדרג ל-GitHub Pro ולהקים Tag ruleset על `v*` שרק בעל הריפו יכול ליצור. חובה לפני נתונים אמיתיים, או לפני שסוכנים מתחילים לפתוח PR מול `main`, לפי מה שקודם.** Pro נדרש גם ל-Ruleset על `main` שבסעיף הבא.
- [ ] Ruleset על `main`: PR חובה, אישור אחד לפחות, בדיקות CI חובה, וחסימת דחיפה ישירה. (2026-11-23: `protect-main` is active: PR required, 1 approval, stale approvals dismissed, no deletion or force push, empty bypass list. Still open: required CI checks, once CI exists.)
- [ ] קובץ CODEOWNERS שמחייב את האישור של בעל הריפו. (2026-11-23: `.github/CODEOWNERS` added; then turn on "Require review from Code Owners" in `protect-main`.)
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
