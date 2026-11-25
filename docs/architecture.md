# Architecture overview

Living description of the code's modules and data model (R-022). Decisions behind it are in docs/adr/; this file describes what exists now. Current state: the T1 monorepo skeleton (ADR-010).

## Modules
A pnpm workspace with two apps and one shared package.

| Package | Owns |
|---|---|
| `apps/api` | NestJS backend. All server logic and HTTP endpoints, under the global prefix `/api`. Today: `GET /api/health`. |
| `apps/web` | React + Vite frontend. The Hebrew RTL UI; UI strings live in `src/locale/`. Today: the app name and a server status line. |
| `packages/contracts` | Shared API types only (no runtime code). Today: `HealthResponse`. |

`packages/repository` (the only package allowed to use Kysely, ADR-006) arrives with the Repository task.

## How they connect
- **Runtime:** in development the browser talks only to the Vite dev server (port 5173). Vite proxies `/api` to Nest on port 3000, so there is one origin and no CORS (ADR-010). How production serves the frontend is still open (ADR-010, Open).
- **Compile time:** controllers in `apps/api` declare contract types as their return types, and `apps/web` uses the same types for responses. The imports are type-only and are erased at build time. A mismatch fails `pnpm build` and `pnpm typecheck`. There is no runtime validation yet (ADR-012 decides it, see ADR-010 Open).

## Build and test model
- `tsconfig.base.json` holds the strict flags; every package extends it and none disables one.
- The root `tsconfig.json` lists project references and `tsc -b` builds them in order (`pnpm typecheck`). `packages/contracts` emits declarations only; `apps/api` compiles to CommonJS in `dist/`; `apps/web` is typechecked by `tsc` and bundled by Vite.
- TypeScript 7 (native compiler) has no classic compiler API, so the Nest CLI is not used. The API builds with `tsc -b`, and `pnpm dev` runs `tsc -b --watch` with `node --watch dist/main.js`.
- Vitest runs in every package (`pnpm test`). `apps/api` uses `unplugin-swc` so Nest decorators and their metadata work in tests; `apps/web` uses jsdom and Testing Library.
- Tests compile the API with SWC, while the shipped API (`dist/`) is emitted by `tsc` (TypeScript 7), so the tests do not exercise the emitted output. A smoke test of `dist/main.js` should be added with CI (T2).

## Data model
None yet. There is no database or persistence in T1. The data model (a separate SQLite file per tenant, accessed only through the Repository layer) arrives with the tenancy and Repository tasks (ADR-001, ADR-006) and will be described here then.
