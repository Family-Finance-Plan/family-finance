# יומן שינויי תהליך

| תאריך | שינוי | מי ביקש | PR |
|---|---|---|---|
| 2026-11-21 | יצירת התהליך, שמונה שלבים, שמונה תפקידים ו-15 כללים ראשוניים | בעל הריפו | חבילת התחלה |
| 2026-11-21 | הוספת ניהול משימות מבוסס Jira, תפקיד product-owner, Skills ו-R-016 עד R-020 | בעל הריפו | חבילת התחלה |
| 2026-11-22 | מעבר מ-Jira ל-GitHub Issues ו-Projects: Milestone במקום Fix Version, gh-sync במקום jira-sync, אכיפת R-016 בהגנת ענף | בעל הריפו | חבילת התחלה |
| 2026-11-22 | הוספת docs/setup-checklist.md, תזכורת הקמת זהות הסוכנים והגנת ענף, ואישור ADR-006 | בעל הריפו | חבילת התחלה |
| 2026-11-23 | הקמת לוח Projects מספר 1, שדות Status ו-Priority, תוויות ו-Milestone v0.1 MVP | בעל הריפו | chore/board-setup |
| 2026-11-23 | סטטוס Ready for Dev ומגבלות WIP לכל שלב (R-021). אחריות לתיעוד עסקי וטכני ותבנית PR (R-022). שתי סביבות Staging ו-Production, Releases לפי tag, מסלול Bug P0 (ADR-009 מוצע, R-023 עד R-025). Deploy Ready ו-Deployed הוחלפו ב-On Staging ו-Released. PR מקושר עם Refs במקום Closes | בעל הריפו | chore/board-setup |
| 2026-11-23 | ADR-009 approved; Render services approved in principle, provisioned only at first deploy / first release after a pricing check; pointer to ADR-009 added in ADR-007. R-027: Refs only, never Closes/Fixes/Resolves, Issue closed only at Released. R-026: English is the default language, Hebrew only for UI text in locale files (CLAUDE.md updated; translation of existing files in a separate PR) | Owner | chore/board-setup |
| 2026-11-23 | Status rename follow-up (ADR-009): merge wording in CLAUDE.md, github-workflow.md and devops.md now allows the owner to merge themselves, agents merge only via devops on their instruction, only the owner publishes a Release. README lists nine ADRs and the PR template | Owner | chore/board-setup |
