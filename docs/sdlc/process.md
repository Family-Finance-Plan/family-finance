# Development process (SDLC)

Process owner: the repo owner. The main agent (Orchestrator) orchestrates and guards the process. Every detailed rule is in rules.md.

Version: v0.1 (2026-11-24). The process has not yet been used on real work and is expected to change. Rules are tagged established or experimental in rules.md.

## Eight stages, each with a gate

| # | Stage | Owning role (subagent) | Work mode | Gate (exit condition) |
|---|---|---|---|---|
| 1 | Requirements and analysis | analyst | plan | Requirements with ID, priority and acceptance criteria. No contradiction with spec-corrections. The owner's approval |
| 2 | Architecture and design | architect | plan | An ADR for every architectural decision. Implementation plan broken into tasks. The owner's approval |
| 3 | UX/UI | ux-designer | plan, then acceptEdits | Screens in RTL, error and empty states, aligned with the requirements. The owner's approval |
| 4 | Development | developer | acceptEdits | Unit tests pass, strict mode, no Repository bypass, a small focused PR |
| 5 | Testing | tester | acceptEdits | Integration and tenant isolation tests pass, acceptance criteria covered |
| 6 | Review and security | reviewer | default | Code and security review per the checklist in rules.md. The owner's manual approval at sensitive points |
| 7 | Deployment | devops | default | CI green, backup proven, no secrets in the repo. Staging after merge with the owner's approval. Production only from a tag with the owner's approval in the Environment (ADR-009) |
| 8 | Operations and learning | orchestrator | plan | Iteration summary, process improvement proposals, review of rules that were not enforced |

## Operating rules
- No move to the next stage without a passed gate. The main agent records the gate result.
- Every role works in an isolated subagent with minimal permissions. The main agent does not write code.
- Points that always require the owner's manual approval: permissions, authentication, real data, secrets, deployment, data deletion, ADR changes.
- A feature starts in plan mode. After the plan is approved, implementation begins.
- Stage review (v0.1): after every gate passes, the orchestrator writes 2-3 lines on what worked and what got in the way, in the Issue comment that records the gate result. Any suggested rule or gate change goes to the owner as a PR. Stage 8 still holds the full iteration review.

## Recommended work order (MVP)
1. Phase 1: Tenancy, authentication, household, document intake (upload, extraction, review, approval), transactions with categories and tags, a basic Dashboard of past data.
2. Phase 2: learning from corrections, one-off items, future events, a Timeline with a base forecast.
3. Phase 3: assets, liabilities and net worth.
4. Phase 4: scenarios, What-If, budget vs actual, decision support, Card Insights.

Note: the phase order is a proposal. To be approved at the requirements gate.

## Task management (GitHub)
- GitHub Issues and the Projects board are the source of truth for tasks, status and version (docs/sdlc/github-workflow.md). No backlog in files.
- Only the main agent reads and writes the board. Subagents return a report.
- No move to On Staging or Released without the owner's explicit approval.
- WIP limits per stage (R-021) and the P0 bug track (R-025): docs/sdlc/github-workflow.md.

## Documentation: who writes what (R-022)
| Document | Type | Owner | When |
|---|---|---|---|
| docs/spec/: a living spec, what the system actually does | Business | analyst | In stage 1, and updated when a feature reaches Released |
| Release notes in the GitHub Release | Business | product-owner | For every Milestone or patch version |
| docs/adr/ | Technical | architect | For every architectural decision (R-005) |
| docs/ux/ | Design | ux-designer | In stage 3 |
| README: running locally; docs/architecture.md: module overview and data model | Technical | developer | In the same PR that changes them |
| API reference | Technical | Generated automatically from NestJS (OpenAPI) | On every build, never written by hand |
| docs/runbook.md: deploy, rollback, single-family restore | Operations | devops | With every change to deployment or backup |
| User guide | Business | Deferred | When there are real users |

Enforcement: the "Documentation" section in the PR template (.github/pull_request_template.md). reviewer marks missing documentation as a blocking finding.
- To run a cycle on the board: `/board-run`. Load gh-sync too.
