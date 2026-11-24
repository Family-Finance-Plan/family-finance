# ADR-006: Data layer

Status: Approved by the process owner (2026-11-22)

## Decision
Kysely over SQLite, behind a Repository layer. Business logic does not import Kysely.
Migrations are kept as files and run on every tenant file through the Migrator.

## Cheap rules that keep portability
1. Amounts as integers in minor units, dates as ISO strings, IDs as UUID text.
2. A period column (for example "2026-11") as a regular field, not date functions that differ between databases.
3. No SQLite-specific functions in queries.

## What we don't do now
Contract tests against a second database and an extra abstraction layer, until there is a real target. Moving to another DB is considered unlikely.

## First test (part of phase 1)
Three tenant files, one migration that runs on all of them, and a monthly summary query.

## Condition for revisiting
Choosing a target database, or a move to a shared tenancy model. Then add contract tests in CI against the new database.
