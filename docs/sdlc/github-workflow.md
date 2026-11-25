# Working with GitHub

GitHub Issues and the GitHub Projects board are the source of truth for tasks, status, version and documentation history.
The repo is the source of truth for the spec, the ADRs and the code.

**Issue closing rule (ADR-009, R-027):** a PR links its Issue with `Refs #n` only. Never use `Closes`, `Fixes`, `Resolves` or any other GitHub closing keyword, because merging only reaches On Staging. An Issue is closed only when its task moves to Released, by the main agent (see gh-sync).
There is no other backlog in files.

Repo and board details: `Family-Finance-Plan/family-finance`, organization board number `1` (https://github.com/orgs/Family-Finance-Plan/projects/1). The agents act as the GitHub App `family-finance-agents` (ADR-011).

## Concept mapping
- **Status:** the Status field on the board (single select), with the same names and order as in the table below.
- **Epic:** an Issue with the `epic` label. Tasks link to it.
- **Task:** a regular Issue, a unit that fits in one PR, with testable acceptance criteria.
- **Sub-task:** a sub-issue of a Task (created by the architect).
- **Bug:** an Issue with the `bug` label.
- **Version:** a Milestone. Mandatory before leaving Analysis & Spec.
- **Priority:** a single select field on the board (P0, P1, P2, P3).
- **Blocker:** GitHub's "blocked by" link. If not available, a line `Blocked by #n` in the Issue body.
- **Claimed by an agent:** the label `agent-<role>` plus a comment.

## Statuses, owners and transitions

| Status | Owning agent | Exit condition | Target |
|---|---|---|---|
| Backlog | product-owner | Chosen for pulling by version order and priority, and WIP allows it | Analysis & Spec |
| Analysis & Spec | analyst, then architect, then ux-designer (if there is UI) | Spec comment, breakdown comment with sub-issues, Milestone set | Test Design |
| Test Design | tester | Test plan comment for every acceptance criterion | Ready for Dev |
| Ready for Dev | Queue, no owner | There is room in In Development per WIP | In Development |
| In Development | developer | PR open (draft allowed), unit tests pass, documentation updated if behavior changed | In Testing |
| In Testing | tester | Integration and isolation tests pass | In Review |
| In Review | reviewer | No blocking finding (including missing documentation) | Awaiting Approval |
| Awaiting Approval | The owner only | You approved the PR, and it was merged by you or by devops on your explicit instruction | On Staging, or back |
| On Staging | devops | The Milestone is complete, devops prepared a draft Release, and you published it (creates the tag and deploys to Production) | Released |
| Released | None | Final state: the Issue is closed and the version is live in Production | None |
| On Hold | Whoever blocked it | The blocker is cleared | The status it came from |

Meaning of the last statuses: Awaiting Approval = the PR is ready for your review. On Staging = the PR was merged to main and deployed automatically to Staging, and is waiting for a Release. Released = included in a version (tag) deployed to Production. Environments and releases: ADR-009.

## WIP limits (R-021)
| Status | Maximum tasks |
|---|---|
| In Development | 2 |
| In Testing | 2 |
| Awaiting Approval | 3 (if full, nothing is pulled from the Backlog) |

A task that finished a stage while the next stage is full stays in the queue: Ready for Dev before development. At the other stages the queue is the next status without an `agent-<role>` label: label present = in progress, no label = waiting. The numbers can be changed with the owner's approval.

## Bugs and Releases (ADR-009)
- **Features:** accumulate in a Milestone and are tested on Staging. When the Milestone is complete, devops prepares a draft GitHub Release (`vX.Y.Z`) with release notes from product-owner. You publish it, which creates the tag and triggers the Production deploy.
- **Regular bug:** goes into the next Release.
- **P0 bug:** fast track. Bypasses the queue and the WIP limits, but skips no gate. Ships as a patch version (`vX.Y.Z+1`), and you publish it like any Release.

## Moving back
- In Testing failed: back to In Development, with a reproduction in the comment.
- In Review with a blocking finding: back to In Development, with the findings in the comment.
- Your rejection in Awaiting Approval: you choose the target, one of Analysis & Spec, Test Design, In Development or On Hold, and the agent records your reason in a comment.
- A blocker or a missing decision: On Hold, with a comment that asks an explicit question.

## Pulling from the backlog (product-owner)
1. Candidates: Issues in Backlog status with no open blocker.
2. Order: the lowest Milestone not yet released first, and by Priority within it.
3. WIP: if Awaiting Approval is full (3), nothing new is pulled. The bottleneck is your review time. The other limits are in the WIP table above.
4. A task without an Epic, Priority or a reference to FR requirements goes back to the analyst to complete and is not pulled.

## How the agents work with GitHub
- The main agent is the only one that reads and writes Issues and the board, through `gh` (GitHub CLI). There is no MCP server. The subagents return a report to it: a comment in the template, and a recommended status.
- The main agent writes the comment, and changes the status only after it has been written.
- Running: `/board-run`. Details in .claude/skills/board-run/SKILL.md and the commands in .claude/skills/gh-sync/SKILL.md.

## Awaiting Approval and enforcing R-016
The main agent shows you a summary: acceptance criteria, test results, review findings, a link to the PR. You answer: approve, or reject with a target and a comment.

The real enforcement is on the merge, not on the board column. A Projects board does not restrict who moves what to which status. Therefore:
- Branch protection on `main` (ruleset): PR required, at least one approval, CODEOWNERS with the owner, required CI checks. Staging on Render deploys only from `main`.
- Production deploys only from a tag, and only the owner creates version tags. Enforced by the `protect-releases` tag ruleset on `v*` (R-023), set up on 2026-11-23 on the old repo; free only while the repo is public (ADR-009). The repo moved to the organization on 2026-11-25; it is public again and both rulesets were recreated there on 2026-11-26.
- On GitHub the author of a PR cannot approve it themselves. If the agents work under your account, you cannot approve their PR. So the agents need a separate identity: the GitHub App `family-finance-agents` (ADR-011), with a short-lived token from `tools/gh-app-token.sh`, never yours.
- Without a separate identity, moving to On Staging and Released remains an instruction only.

## One-time setup (the owner)
1. Create a Projects board and a Status field with the statuses above, a Priority field, and add the repo.
2. Create labels: `epic`, `bug`, `agent-analyst`, `agent-architect`, `agent-ux-designer`, `agent-developer`, `agent-tester`, `agent-reviewer`, `agent-devops`.
3. Create Milestones for the versions.
4. Install `gh` on the computer. It authenticates with the App token (`export GH_TOKEN=$(bash tools/gh-app-token.sh)`), not with `gh auth login`.
5. Set up a separate identity for the agents and branch protection as described above.
5a. Done 2026-11-23: repo made public and the `protect-releases` tag ruleset on `v*` is active, only the owner can create release tags (ADR-009). Still to do: the two Render services (Staging and Production) per ADR-009.
6. ~~Replace the repo and board placeholders in the files.~~ Done 2026-11-23.
7. Done 2026-11-26: the repo moved to the `Family-Finance-Plan` organization; the GitHub App created the new board, the Status and Priority fields, the labels and the `v0.1 MVP` Milestone (ADR-011).
