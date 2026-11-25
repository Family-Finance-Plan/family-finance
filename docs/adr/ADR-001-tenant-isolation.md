# ADR-001: Tenant isolation

Status: Approved

## Context
A generic platform for households (ARCH-02, FR-05), sensitive financial data, and in the first phase no DB server.

## Decision
- Every household is a tenant with a separate SQLite file and a separate folder for source documents.
- Only one data access layer opens files.
- The schema is managed with migrations. A tenant_id field in every table even though each tenant has its own file.
- Amounts as integers in minor units, UUID identifiers.

## Consequences
Physical isolation between families. Creating a family is creating a file. A backup is copying a file.
Cross-family analysis and updating the schema across all files are harder.

## Rejected alternatives
A shared database with tenant_id and Row-Level Security (kept as a future phase). Raw JSON or CSV files.

## Condition for revisiting
Hundreds of families, a need for cross-family analysis, or concurrent write load within the same family.
