# Family Finance – starter kit for Claude Code

## How to use
1. Create a new Git repo and copy the contents of this folder into it (including the hidden .claude folder).
2. Run Claude Code at the repo root. CLAUDE.md loads automatically.
3. Start in plan mode with the request: "Read CLAUDE.md, docs/spec and docs/adr, and propose a plan for MVP phase 1 according to docs/sdlc/process.md".
4. If the subagents are not recognized, restart Claude Code.

## Running locally
Prerequisites: Node 26 (see `.nvmrc`) and pnpm, installed once with `npm install -g pnpm` (it switches to the version pinned in `package.json` by itself).

```sh
pnpm bootstrap
```

This installs the dependencies and starts the API (http://127.0.0.1:3000, under `/api`) and the web app together. Open http://localhost:5173. The web dev server proxies `/api` to the API, so the browser sees one origin.

The clickable UX prototype (demo data only, no backend) runs at http://127.0.0.1:5174.

The API listens on `127.0.0.1:3000` by default. The `HOST` and `PORT` environment variables override this (the hosting platform sets them); nothing needs to be set locally.

Other commands, run from the repo root:
- `pnpm dev` – start the API, the web app and the prototype in parallel
- `pnpm build` – build all packages
- `pnpm typecheck` – strict TypeScript check of the whole workspace (`tsc -b`)
- `pnpm test` – run the Vitest suites of all packages
- `pnpm format` – format code with Prettier

Workspace layout (ADR-010):
- `apps/api` – NestJS backend
- `apps/web` – React + Vite frontend (Hebrew, RTL)
- `packages/contracts` – shared API types

## Structure
- CLAUDE.md – standing principles, short on purpose
- docs/spec/ – the original spec and spec-corrections.md (overrides the original)
- docs/adr/ – eleven architecture decisions (ADR-001 to ADR-011)
- .github/pull_request_template.md – PR template (Refs #n, tests, docs, safety checklist)
- docs/sdlc/ – stages, gates, roles, rule register and change log
- .claude/agents/ – eight subagents (analyst, architect, ux-designer, developer, tester, reviewer, devops, product-owner)
- .claude/skills/ – tenancy-standards, process-keeper, gh-sync and board-run
- tools/gh-app-token.sh – one-hour token for the agents' GitHub App (ADR-011)

## GitHub setup (one-time)
See "One-time setup" in docs/sdlc/github-workflow.md: Projects board and statuses, labels, Milestones, `gh` connected, a separate identity for the agents and branch protection.

## Before the real work
docs/setup-checklist.md: setting up a separate identity for the agents and protecting the main branch. Claude Code will remind you at the start of a session and go through it with you.

## What is still missing
In docs/spec/spec-corrections.md, section D. In addition: secret scanning and hooks that enforce rules R-004, R-007, R-011, R-012 still need to be set up in the development stage. Lint runs in CI since T3 (Oxlint, ADR-010).
