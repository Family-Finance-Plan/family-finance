# ADR-002: Authorization in two layers

Status: Approved (the detailed permission matrix, FR-06, is still open)

## Decision
- A small, separate central store (Control Plane) holds users, the user-to-household link and the role. It is not stored in the family files.
- In the first phase a user belongs to one household only. This is a deliberate limitation.
- The tenant is determined from the authenticated session only, and never from a parameter that comes from the browser.
- Only the data access layer receives a file path from the central store, after a permission check.
- Roles within a tenant: household admin, partner, limited user.

## Consequences
An automatic test on every build: a user from family A cannot reach family B's data. The access attempt must fail.

## Optional future hardening
Separate encryption per family (SQLCipher) with a key released only to an authorized session.

## Condition for revisiting
A need for one user in several households. Then move to a many-to-many link table and choosing the active household at sign-in.
