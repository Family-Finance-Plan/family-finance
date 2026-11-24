# ADR-005: Tech Stack

Status: Approved

## Decision
TypeScript end to end in one monorepo.
- Backend: NestJS (a modular structure that fits ADR-002 and ADR-004).
- Frontend: React with TypeScript. Charts and tables for the Dashboard and Timeline. RTL with CSS logical properties.
- A typed API contract shared by the Frontend and the Backend. A contract change breaks the build.
- The AI pipeline in the same language, no Python.

## Consequences
One language for the whole system. Requires discipline in tests and types (strict mode).

## Rejected alternatives
Microsoft: .NET and Angular.

## Condition for revisiting
A need for a library or calculation engine that exists only in another language.
