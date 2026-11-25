---
name: gh-sync
description: How the main agent reads and updates the GitHub Issues and Projects board for Family Finance with the gh CLI: statuses, comment templates per role, claim protocol, and transition rules. Use whenever reading task state, writing task documentation or moving a task between statuses.
---

# Syncing with GitHub

Only the main agent reads and writes. Subagents return a report. Flow details: docs/sdlc/github-workflow.md.

## Identity and token (ADR-011)
The agents act as the GitHub App `family-finance-agents` (`family-finance-agents[bot]`), never as the owner. At the start of a run, and again after an hour, get a fresh token in the same shell:
`export GH_TOKEN=$(bash tools/gh-app-token.sh)`
Never print, log or save the token (R-007). If the script fails, stop and report; don't fall back to another token or account.
To push with the App: `git -c http.extraHeader="Authorization: Basic $(printf 'x-access-token:%s' "$GH_TOKEN" | base64 -w0)" push origin <branch>`.

## Reading the board
Repo `Family-Finance-Plan/family-finance`, organization board number 1:
- All board items with status: `gh project item-list 1 --owner Family-Finance-Plan --format json --limit 200`
- Issue details including comments: `gh issue view <n> --repo Family-Finance-Plan/family-finance --comments --json title,body,labels,milestone,comments`
- Field and option IDs: `gh project field-list 1 --owner Family-Finance-Plan --format json`
Backlog order: Milestone ascending, then Priority. Filter and sort the JSON with a short script, not by eye.
If `gh` is not connected or lacks permission, stop and report. Don't guess a status.
Verified 2026-11-26 with the App token: `item-list`, `field-list` and `project view` work. `item-edit` is untested until the first task exists; verify it on the first real run and fix it here.

## Claiming a task
Before work: a comment "[role] started" and the label `agent-<role>` (`gh issue edit <n> --add-label`). If there is already a label of another role, or of the same role in an active run, skip it. When done, remove the label.

## Transition rule
1. Verify that the exit conditions in the status table are met.
2. Write the comment in the template (`gh issue comment <n> --body-file`). Only after that, change the status.
3. Status change: `gh project item-edit --id <item> --project-id <project> --field-id <status-field> --single-select-option-id <option>`.
   Fixed IDs of the organization board (2026-11-26; verify against `field-list` if something fails): project-id `PVT_kwDOFYlAys4BtPYU`. Status `PVTSSF_lADOFYlAys4BtPYUzhrZxs4`: Backlog `567f64f8`, Analysis & Spec `8eab332c`, Test Design `5dd9b361`, Ready for Dev `f7263aba`, In Development `1cd09c56`, In Testing `1f231925`, In Review `d4444c46`, Awaiting Approval `4f1797c2`, On Staging `b4c36411`, Released `1c46c93f`, On Hold `16d5ad0b`. Priority `PVTSSF_lADOFYlAys4BtPYUzhrZxt4`: P0 `7b7f5ab3`, P1 `e5fb4915`, P2 `c32e69ce`, P3 `8cc4d39b`.
4. On Staging and Released only with the owner's explicit approval in the same conversation (R-016), and in practice only after they approved the PR (On Staging) or the Release was approved and deployed (Released). Never on an agent's initiative.
5. **Issue closing (R-027):** PRs link Issues with `Refs #n` only, never `Closes`, `Fixes`, `Resolves` or another closing keyword. An Issue is closed only when its task moves to Released: `gh issue close <n> --repo Family-Finance-Plan/family-finance --comment "Released in vX.Y.Z"`. If an Issue closed early (for example a closing keyword slipped into a PR), reopen it and leave a comment.
6. Before a forward move: check the WIP limit of the target status (R-021). A P0 bug bypasses it (R-025).
7. If information or a decision is missing: On Hold with an explicit question.

## Comment templates (uniform heading, in English per R-026)
**Spec (analyst):** spec level (draft/ready), related FRs, acceptance criteria, open points, proposed Milestone.
**Breakdown (architect):** sub-issues (created separately and linked), relevant ADR, risks.
**Design (ux-designer):** link to the spec in docs/ux, screen states, RTL notes.
**Test design (tester):** a test for every acceptance criterion, including tenant isolation where relevant.
**Development (developer):** branch, PR link, what was built, what is not finished.
**Testing (tester):** a result for every test, failures with reproduction.
**Review (reviewer):** findings by severity (blocking, important, note), file and line.
**Approval (the owner):** decision, target if rejected, their comment in their own words.

## Moving back
Always with a comment that explains why, and a link to the finding. An agent that sends a task back does not move it forward after fixing it itself.

## Pacing GitHub writes (R-028)
A write is any call that creates or changes something: a new or edited Issue, a comment, a label, a board item edit, a PR.
- Wait 2-3 seconds between writes. A small random variation is fine, so writes don't land at exact intervals; it is not meant to disguise automation.
- Before a run with more than 20 writes, tell the owner the count and what will be written, and wait for their approval. Never more than 100 writes per hour.
- Prefer fewer writes: one comment instead of several, labels in the same `gh issue create` call.

### When GitHub says "slow down"
Signs: HTTP 403 or 429, a message about "secondary rate limit" or "abuse", or `x-ratelimit-remaining: 0`.
1. Stop the run at once. Do not send the next write, and do not retry the failed one right away.
2. Find out how long to wait, in this order:
   - `Retry-After` header: wait that many seconds.
   - otherwise `x-ratelimit-remaining: 0`: wait until the time in `x-ratelimit-reset` (Unix time).
   - otherwise: wait at least 60 seconds.
3. Report to the owner: what failed, how many writes were done and which are still pending, and the wait time. Save the pending list so the run can resume without repeating writes.
4. After the wait, resume only the pending writes, at a slower pace (double the delay). A second slow-down in the same run ends the run: report and wait for the owner.
5. Never retry in a loop, never switch to another account or token, and never try to get around the limit.

### When the account is blocked
Signs: GraphQL limit 0 with nothing used (`gh api rate_limit --jq .resources.graphql`), a message about the account being suspended or flagged, or `gh auth status` saying the token is invalid while `curl` with the same token works.
Stop all GitHub work and tell the owner. Do not regenerate the key or token, or change settings. Only the owner contacts GitHub Support. Once unblocked, keep runs small for the first week. (This happened to the earlier bot user account on 2026-11-24; see ADR-011.)

## Forbidden
Changing the Priority or Milestone of an existing task without the owner's approval. Deleting Issues, comments or branches. Merging a PR. Writing secrets or real family data in Issues.
