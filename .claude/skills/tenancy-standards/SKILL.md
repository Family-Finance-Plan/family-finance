---
name: tenancy-standards
description: Multi-tenant standards for Family Finance: tenant resolution from session, one SQLite file per household, repository access, isolation tests, money and date conventions. Use when touching data access, auth, migrations, or anything that crosses tenants.
---

# Multi-tenancy standards

## Tenant resolution
1. The Control Plane (a separate central database) holds users, their household and their role. No transaction data.
2. On sign-in: Google authentication (stable `sub`), look up the user in the Control Plane, determine the tenantId, store it in the session.
3. Every request: the Guard takes the tenantId from the session. The tenantId is never read from the URL, request body or a header.
4. The TenantContext is passed to the data access layer, which is the only layer that receives a file path.

## Data access layer
- Repository interfaces (for example TransactionRepository) are the contract. The only implementation for now: Kysely over SQLite.
- A connection to a tenant file is opened by the verified tenantId, kept in a bounded cache, and closed when no longer used.
- tenant_id exists in every table even though each tenant has its own file, and is in every query as an extra condition (defense in depth).

## Migrations
- Migration files with an ISO date in the name. They run on every tenant file through the Migrator.
- A migration that fails midway: continue with the other tenants, report, and never leave a tenant half-migrated (one transaction per tenant).
- Before a destructive migration: back up the file.

## Data conventions
- Amount: an integer in minor units (agorot) + a currency field.
- Date: an ISO string. A period column (for example "2026-11") as a regular field.
- ID: UUID as text.
- Effective-dated values: effective_from, effective_to, previous_value, source, certainty, note.
- certainty of future data: verified, expected, estimate only.

## Isolation test (mandatory on every build)
1. Create two tenants with different dummy data.
2. Call every endpoint with tenant A's session and try to request tenant B's resource IDs (in the URL, body and parameters).
3. Expected: 403 or 404, and no tenant B data in the response, the log or an error message.
4. An extra test: a session without a tenant is rejected.

## Forbidden
Opening a SQLite file outside the data access layer. Inferring the tenant from a file name or from a field the user controls. Merging data across tenants in application code.
