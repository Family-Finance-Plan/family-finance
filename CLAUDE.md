# Family Finance – standing instructions for agents

A generic web platform for family financial management and planning. Every household is an isolated tenant.
This document is loaded in every session, so it is short. Details are in docs/ and .claude/skills/.

## Sources of truth (read before working)
- Spec: docs/spec/ (including docs/spec/spec-corrections.md, which overrides the original spec)
- Architecture decisions: docs/adr/ (ADR-001 to ADR-011)
- Process and gates: docs/sdlc/process.md and docs/sdlc/rules.md
- If something is not in these files, it has not been decided. Ask, don't invent.

## Principles that must never be broken
1. A platform, not a solution for one family. No code, path or configuration specific to a family.
2. Tenant = a separate SQLite file. The tenant is determined from the authenticated session only, never from a browser parameter (ADR-001, ADR-002).
3. Data access only through the Repository layer. Business logic does not import Kysely (ADR-006).
4. Amounts as integers in minor units (agorot). No floating point. Dates as ISO strings. UUID identifiers.
5. The core module (Cash Flow Core) is based on the bank statement. The Card Insights module is separate, and the relationship is one-way: it does not feed cash flow amounts (ADR-004).
6. Future data is always marked: verified, expected or estimate. Never mix them. A forecast is not a promise.
7. Income and expense values are never overwritten. Keep the effective date and the previous value.
8. An extracted transaction does not enter the system without user approval on the review screen.
9. Real family data does not go up to the Render environment until there is authentication and an encrypted nightly backup per tenant. Until then, dummy data only.
10. Secrets only in environment variables. Never in the repo, in logs or in examples.
11. No personal details anywhere (R-029): no real names, emails, phone or ID numbers, addresses, account numbers or real figures in files, commits, Issues, PRs or comments. Use roles, placeholders or synthetic data.

## Stack (ADR-005)
TypeScript end to end, monorepo. Backend: NestJS. Frontend: React. Data: Kysely over SQLite.
Authentication: Google OIDC (ADR-003). Document extraction: Claude API behind a single Provider interface (ADR-008).
Deployment: Render with a persistent disk, single instance (ADR-007).

## Language and RTL (R-026)
English is the default for everything: docs, ADRs, notes, code, comments, identifiers, commit messages, PR and Issue text, agent and skill files, and chat replies to the owner.
The only exception is end-user UI text: Hebrew, RTL, kept in locale/resource files and never hardcoded. Use CSS logical properties (margin-inline, padding-inline, etc.) from the start.

## How we work (details in docs/sdlc/process.md)
- Every task goes through the stages in order, and every stage has a gate. No skipping.
- The main agent orchestrates and does not write code itself. Every role has a subagent in .claude/agents/.
- Work mode: planning in plan mode. Implementation in acceptEdits. Anything that touches the DB, secrets, permissions, deployment or infrastructure stays in default with manual approval.
- A critical rule must have automatic enforcement (test, CI or hook). An instruction alone is a recommendation.
- An architectural change = a new ADR. A process change = an update to docs/sdlc/rules.md through a PR, approved by the process owner.

## Task management (GitHub)
- GitHub Issues and the Projects board are the source of truth for tasks, status and version (Milestone). The main agent reads and writes; subagents return a report.
- No move to On Staging or Released without the owner's explicit approval. Agents merge a PR only through devops and only on the owner's explicit instruction; the owner may merge themselves. Only the owner publishes a Release (ADR-009). Work through `gh`.
- To run the board: /board-run. Details in docs/sdlc/github-workflow.md.

## Open setup
- If docs/setup-checklist.md has an unticked item, remind the owner at the start of the session and go through the list with them step by step. If the repo is ever private again on GitHub Free, rulesets are not enforced and R-016 becomes guidance only. Real data is forbidden until the checklist is complete.

## Process owner
The owner approves gates, ADRs and process changes. At sensitive points (security, permissions, real data) there is no decision without their approval.

## Updating the instructions
If asked to add a rule: add a row to docs/sdlc/rules.md (ID, stage, owning role, enforcement, reason, date, status), update the relevant subagent and the test or hook if needed, and log it in docs/sdlc/process-changelog.md.
