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
   מזהים קבועים (לוודא מול `field-list` אם משהו נכשל): project-id `PVT_kwHOA3kjEs4Bs3Df`. Status `PVTSSF_lAHOA3kjEs4Bs3DfzhrDKUE`: Backlog `9ee7f933`, Analysis & Spec `968af1d2`, Test Design `50e6e31b`, Ready for Dev `0e58bee8`, In Development `20c78f97`, In Testing `210bcb53`, In Review `7bea21c1`, Awaiting Approval `8f4957a5`, On Staging `1a0fb39b`, Released `58c2a041`, On Hold `f43ee6f9`. Priority `PVTSSF_lAHOA3kjEs4Bs3DfzhrDKqQ`: P0 `d583d228`, P1 `1ede08f1`, P2 `7b441014`, P3 `2b6b65c7`.
4. On Staging ו-Released רק עם אישור מפורש של בעל הריפו באותה שיחה (R-016), ובפועל רק אחרי שה-PR אושר על ידו (On Staging) או שה-Release אושר ופורס (Released). לעולם לא ביוזמת סוכן.
5. **Issue closing (R-027):** PRs link Issues with `Refs #n` only, never `Closes`, `Fixes`, `Resolves` or another closing keyword. An Issue is closed only when its task moves to Released: `gh issue close <n> --repo <OWNER>/family-finance --comment "Released in vX.Y.Z"`. If an Issue closed early (for example a closing keyword slipped into a PR), reopen it and leave a comment.
6. לפני מעבר קדימה: לבדוק מגבלת WIP של סטטוס היעד (R-021). Bug P0 עוקף אותה (R-025).
7. אם חסר מידע או החלטה: On Hold עם שאלה מפורשת.

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

## Pacing GitHub writes (R-028)
A write is any call that creates or changes something: a new or edited Issue, a comment, a label, a board item edit, a PR.
- Wait 2-3 seconds between writes. A small random variation is fine, so writes don't land at exact intervals; it is not meant to disguise automation.
- Before a run with more than 20 writes, tell the owner the count and what will be written, and wait for their approval. Never more than 100 writes per hour.
- Prefer fewer writes: one comment instead of several, labels in the same `gh issue create` call.

### When GitHub says "slow down"
Signs: HTTP 403 or 429, a message about "secondary rate limit" or "abuse", or `x-ratelimit-remaining: 0`.
1. Stop the run at once. Do not send the next write, and do not retry the failed one right away.
2. Find out how long to wait, in this order:
   - `Retry-After` header: wait that many seconds.
   - otherwise `x-ratelimit-remaining: 0`: wait until the time in `x-ratelimit-reset` (Unix time).
   - otherwise: wait at least 60 seconds.
3. Report to the owner: what failed, how many writes were done and which are still pending, and the wait time. Save the pending list so the run can resume without repeating writes.
4. After the wait, resume only the pending writes, at a slower pace (double the delay). A second slow-down in the same run ends the run: report and wait for the owner.
5. Never retry in a loop, never switch to another account or token, and never try to get around the limit.

### When the account is blocked
Signs: GraphQL limit 0 with nothing used (`gh api rate_limit --jq .resources.graphql`), a message about the account being suspended or flagged, or `gh auth status` saying the token is invalid while `curl` with the same token works.
Stop all GitHub work and tell the owner. Do not regenerate the token or change settings. Only the owner contacts GitHub Support. Once unblocked, keep runs small for the first week.

## אסור
לשנות Priority או Milestone של משימה קיימת בלי אישור בעל הריפו. למחוק Issues, תגובות או ענפים. למזג PR. לכתוב סודות או נתוני משפחה אמיתיים ב-Issues.
