# ADR-007: Development and deployment environment

Status: Approved

## Decision
- Development in Claude Code on the computer. The code is in Git.
- Render pulls the code and deploys it as a development and test environment, with a persistent disk for the tenant files.
- The tablet is used for tracking and approvals only (Remote Control connects the Claude app to a session running on the computer, which must stay on).

## Render limitations to know
- A persistent disk is accessible to one instance only, so there is no horizontal scaling.
- A disk prevents zero-downtime deploys (a few seconds on every deploy).
- Render's automatic backup runs once every 24 hours, is kept for at least 7 days, and a restore brings back the whole disk (not a single family).

## Rules
1. Dummy data only on Render until there is authentication and an encrypted nightly backup per tenant.
2. Application-level backup (each tenant file separately, encrypted, to external object storage) is part of the first implementation.
3. Secrets as environment variables on Render, not in the repo.
4. Check the deployment region and the privacy question for financial data of families in Israel with a legal advisor.

## Condition for revisiting
Real families in the system, a need for zero-downtime deploys, or a move to a shared database.

## Extended by
ADR-009 (environments and releases) extends this ADR with separate Staging and Production services on Render, tag-based releases, and owner-only release publishing.
