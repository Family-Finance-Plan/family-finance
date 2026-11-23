# Family Finance – חבילת התחלה ל-Claude Code

## איך משתמשים
1. פותחים ריפו חדש ב-Git ומעתיקים אליו את תוכן התיקייה הזו (כולל התיקייה הנסתרת .claude).
2. מריצים Claude Code בשורש הריפו. CLAUDE.md נטען אוטומטית.
3. מתחילים ב-plan mode עם הבקשה: "קרא את CLAUDE.md, docs/spec ו-docs/adr, והצע תוכנית לשלב 1 של ה-MVP לפי docs/sdlc/process.md".
4. אם תתי-הסוכנים לא מזוהים, מפעילים מחדש את Claude Code.

## מבנה
- CLAUDE.md – עקרונות קבועים, קצר בכוונה
- docs/spec/ – האפיון המקורי ו-spec-corrections.md (גובר על המקור)
- docs/adr/ – ten architecture decisions (ADR-001 to ADR-010)
- .github/pull_request_template.md – PR template (Refs #n, tests, docs, safety checklist)
- docs/sdlc/ – שלבים, Gates, תפקידים, רישום כללים ויומן שינויים
- .claude/agents/ – שמונה תתי-סוכנים (analyst, architect, ux-designer, developer, tester, reviewer, devops, product-owner)
- .claude/skills/ – tenancy-standards, process-keeper, gh-sync ו-board-run

## הקמת GitHub (חד-פעמי)
ראה "הקמה חד-פעמית" ב-docs/sdlc/github-workflow.md: לוח Projects וסטטוסים, תוויות, Milestones, `gh` מחובר, זהות נפרדת לסוכנים והגנת ענף.

## לפני העבודה האמיתית
docs/setup-checklist.md: הקמת זהות נפרדת לסוכנים והגנת הענף הראשי. Claude Code יזכיר את זה בתחילת סשן ויעבור על זה איתך.

## מה עדיין חסר
ב-docs/spec/spec-corrections.md, סעיף ד'. בנוסף: lint, סריקת סודות ו-Hooks שמאכפים את הכללים R-004, R-007, R-011, R-012 עדיין צריך להקים בשלב הפיתוח.
