# ADR-009: Environments and releases (Staging and Production)

Status: Approved by the owner (2026-11-23). Extends ADR-007 and does not replace it. The items under "Open" stay open; they block only real data in Production. Amended 2026-11-23 (approved by the owner): enforcement uses a public repo instead of GitHub Pro; see Decision.

## Context
ADR-007 defines Render as a development and test environment only. The process owner needs control over what reaches the live version, for both bug fixes and features, without every merge to `main` reaching customers.

> **2026-11-26:** the repo moved to the `Family-Finance-Plan` organization with a cleaned history (ADR-011, R-029). It is public again and the rulesets below were recreated there and are active.

## Decision
- Two environments on Render, each a separate service with its own persistent disk:
  - **Staging:** automatic deploy on every merge to `main`. Dummy data only, always.
  - **Production:** automatic deploy off. Deploy only from a version tag (semver `vX.Y.Z`), through a GitHub Actions workflow triggered by the tag.
- **Who approves:** only the owner creates a version tag, when they publish a GitHub Release. Creating the tag is the deploy approval.
  - Enforcement: the `protect-releases` tag ruleset on `v*` restricts creation, update and deletion; only the Repository admin role (the owner) bypasses it. Active since 2026-11-23.
  - The repo was made public on 2026-11-23 instead of paying for GitHub Pro, because rulesets are free on public repos. A full scan of history, branches, issues and PRs found no secrets or family data; only commit author emails are exposed. Real family data and secrets must never be committed.
  - Alternative considered: required reviewers on a GitHub Environment. On a private repo it is available only on Enterprise, so it was not chosen.
- Release flow: features accumulate in a Milestone and are verified on Staging. When the Milestone is complete, devops prepares a draft GitHub Release with release notes from product-owner. The owner publishes it, which creates the tag and triggers the deploy.
- Bugs: a regular bug goes into the next version. A P0 bug gets a fast track: it jumps the backlog queue, skips no gate, and ships as a patch (`vX.Y.Z+1`) through the same Production approval.
- Board statuses: Deploy Ready and Deployed are replaced by **On Staging** (the PR was merged to `main` and deployed to Staging) and **Released** (included in a version live in Production, and the Issue is closed).

## Rules
1. Production stays on dummy data until the R-006 conditions are met (authentication and an encrypted nightly backup per tenant).
2. Before every Production deploy: an automatic application-level backup of every tenant file (not Render's disk snapshot).
3. Rollback = redeploying the previous tag. If a migration is not reversible, restore the tenant backups.
4. Migrations are forward compatible and run per tenant in a separate transaction (ADR-001, ADR-006).
5. Each environment's secrets (including the Production deploy key) as environment variables and GitHub Actions secrets, not in the repo (R-007).

## Consequences
- A second Render service with a disk adds a monthly cost.
- **Provisioning (approved in principle only, 2026-11-23):** nothing is provisioned now. Staging is created together with the first deploy. Production is created only when the first release is close. A persistent disk requires a paid instance (not the Free instance), so before creating either service, devops checks Render's current instance and disk pricing and presents it to the owner for approval.
- Deployment control: the `protect-main` ruleset with CODEOWNERS (R-016) controls what reaches Staging, and the `protect-releases` tag ruleset (R-023) controls what reaches Production. Both are enforced since 2026-11-23, with the agents working as the bot account. Required CI checks are added to `protect-main` once CI exists.
- The process gets longer: a merge is not a release, and an Issue stays open until Released.

## Rejected alternatives
One environment with manual deploys from `main` (no room for verification before customers). Continuous deploy to Production on every merge (no control over the timing and content of a version). A separate `release` branch instead of tags (more branches to maintain, the same control). GitHub Pro on a private repo (monthly cost; The owner chose a public repo instead, 2026-11-23).

## Open
- The deployment region and the privacy question with a legal advisor (ADR-007, rule 4). Blocks real data in Production.
- A downtime window policy for Production deploys (the disk prevents zero-downtime deploys, ADR-007).
- Whether feature flags are needed.

## Condition for revisiting
A need for zero-downtime deploys, more than one instance, a move to a shared database, or a rate of P0 fixes that justifies a separate track.
