# ADR-010: Monorepo tooling and workspace layout

Status: Approved by the owner (2026-11-24). Implements ADR-005 for task T1 (issue #12). Amended 2026-11-24 (the owner): Node 26 instead of Node 24, and pnpm installed with npm because Node 25+ no longer bundles Corepack.

## Context
ADR-005 sets TypeScript end to end in a monorepo, with NestJS for the backend and React for the frontend, but does not name the package manager, build tooling, layout or test runner. T1 (issue #12) needs these fixed before the first scaffold so that every later task builds on one setup. The goals: one command on a fresh clone, shared typed contracts that break the build on mismatch, and few moving parts for a single-developer project.

## Decision
1. **Package manager:** pnpm workspaces. The pnpm version is pinned in the root `package.json` `packageManager` field. pnpm is installed once with `npm install -g pnpm`, and it switches to the pinned version itself. No Turborepo or Nx.
2. **Runtime:** Node 26 LTS (supported until 2029), pinned in `.nvmrc` and in `engines`. devops verifies that Render supports Node 26 before the deploy task.
3. **Layout:**
   - `apps/api`: NestJS backend.
   - `apps/web`: React frontend.
   - `packages/contracts`: shared API types.
   - `packages/repository`: arrives with T6. It is the only package allowed to depend on Kysely (ADR-006); T3 adds the automated enforcement.
4. **Web build:** Vite.
5. **Tests:** Vitest in all packages, with `unplugin-swc` so Nest decorators and metadata work. Fallback to Jest for `apps/api` only, and only if Vitest proves unworkable there.
6. **Contracts:** TypeScript types only in T1. The root `tsconfig` uses project references and builds with `tsc -b`. API controllers return contract types and the web client consumes them, so any mismatch fails `pnpm build` and `pnpm typecheck`.
7. **Dev wiring:** `pnpm dev` runs api and web in parallel. Vite proxies `/api` to Nest, so the browser sees one origin and no CORS is configured.
8. **Fresh clone:** after the README prerequisites (Node 26, `npm install -g pnpm`), one documented command, `pnpm bootstrap`, installs dependencies and starts both apps.
9. **Formatting:** Prettier with `endOfLine: lf` in T1. ESLint arrives in T3. `.gitattributes` is extended to `* text=auto eol=lf`.
10. **Strict TypeScript everywhere:** `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `forceConsistentCasingInFileNames`, set in a shared base config. No package may disable a strict flag.

## Consequences
- Contributors need Node 26 and a global pnpm; the pinned pnpm version removes "works on my machine" lockfile drift.
- Contract drift between api and web is a compile error, not a runtime surprise. There is no runtime validation yet (see Open).
- Without a task runner, build ordering relies on `tsc -b` project references and pnpm's topological `-r` runs. Acceptable at this size.
- Vitest with SWC for Nest is less common than Jest; the Jest fallback for `apps/api` limits the risk.
- The Kysely boundary is a documented rule until T3 adds the lint/CI check; until then it is advisory only.
- The LF rule may produce a one-time line-ending diff across existing files.

## Rejected alternatives
- npm workspaces: weaker workspace protocol and dependency isolation; no strict hoisting control.
- Yarn: no advantage over pnpm here, and Berry/PnP adds friction with Nest and tooling.
- Turborepo / Nx: caching and orchestration not needed for two apps and one package; extra config and concepts.
- Next.js: SSR and its own server overlap with NestJS and complicate the one-backend model (ADR-005).
- Create React App: deprecated and unmaintained.
- Jest everywhere: slower, and awkward with Vite and ESM in the web app; Vitest gives one runner.
- Zod / ts-rest / OpenAPI codegen for T1: premature before the first real endpoint; deferred to ADR-012.
- CORS-based dev wiring: two origins in dev diverge from production and add config that the proxy avoids.

## Open
- Runtime validation of contracts and how it relates to the OpenAPI output required by R-022. To be decided in ADR-012 before the first real endpoint (renumbered 2026-11-26: ADR-011 went to the GitHub App identity).
- Module format (ESM vs CommonJS) once `packages/contracts` contains runtime code.
- How production serves the frontend: Nest serving static files vs a separate Render static site (ADR-007, ADR-009).

## Revisit conditions
Build or test times that make a task runner worthwhile, more apps or packages than project references handle cleanly, Render not supporting Node 26, Vitest failing for Nest (triggers the Jest fallback), or ADR-012 choosing a contract approach that changes the package layout.
