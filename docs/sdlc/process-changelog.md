# Process change log

| Date | Change | Requested by | PR |
|---|---|---|---|
| 2026-11-21 | Process created: eight stages, eight roles and 15 initial rules | Owner | Starter kit |
| 2026-11-21 | Added Jira-based task management, the product-owner role, skills and R-016 to R-020 | Owner | Starter kit |
| 2026-11-22 | Moved from Jira to GitHub Issues and Projects: Milestone instead of Fix Version, gh-sync instead of jira-sync, R-016 enforced through branch protection | Owner | Starter kit |
| 2026-11-22 | Added docs/setup-checklist.md, the reminder to set up the agents' identity and branch protection, and approval of ADR-006 | Owner | Starter kit |
| 2026-11-23 | Set up Projects board number 1, the Status and Priority fields, labels and the v0.1 MVP Milestone | Owner | chore/board-setup |
| 2026-11-23 | Ready for Dev status and WIP limits per stage (R-021). Ownership of business and technical documentation and a PR template (R-022). Two environments, Staging and Production, tag-based Releases, a P0 bug track (ADR-009 proposed, R-023 to R-025). Deploy Ready and Deployed replaced by On Staging and Released. PRs link with Refs instead of Closes | Owner | chore/board-setup |
| 2026-11-23 | ADR-009 approved; Render services approved in principle, provisioned only at first deploy / first release after a pricing check; pointer to ADR-009 added in ADR-007. R-027: Refs only, never Closes/Fixes/Resolves, Issue closed only at Released. R-026: English is the default language, Hebrew only for UI text in locale files (CLAUDE.md updated; translation of existing files in a separate PR) | Owner | chore/board-setup |
| 2026-11-23 | Status rename follow-up (ADR-009): merge wording in CLAUDE.md, github-workflow.md and devops.md now allows the owner to merge themselves, agents merge only via devops on their instruction, only the owner publishes a Release. README lists nine ADRs and the PR template | Owner | chore/board-setup |
| 2026-11-23 | ADR-009 amended: repo made public instead of paying for GitHub Pro, after a full privacy scan. `protect-main` (PR, 1 approval, Code Owners) and `protect-releases` (`v*` tags, admin only) rulesets active; CODEOWNERS added. R-016 and R-023 move from recommendation to enforced | Owner | chore/lock-setup-checklist |
| 2026-11-24 | Process marked v0.1. Short stage review after every gate, recorded in the gate comment, with rule changes proposed as a PR. Rules get a Status column: all 27 start as experimental, promoted to established after automatic enforcement plus one full iteration, with the owner's approval | Owner | chore/board-run-check |
| 2026-11-24 | R-028: paced GitHub writes, approval for runs over 20 writes, a 100-per-hour cap, stopping on the first slow-down response, and what to do when the account is blocked. Added after GitHub restricted the bot account. New "Pacing GitHub writes" section in gh-sync | Owner | chore/board-run-check |
| 2026-11-24 | R-026 follow-up: all remaining Hebrew docs, ADRs, agent and skill files translated to English. No rule or decision changed | Owner | chore/translate-docs-en |
