---
name: board-run
description: Run one pass over the GitHub Projects board: sample every status, dispatch the owning subagent for each task, write its documentation, advance the status per the SDLC, and report. Use when the user says run the board, continue the work, or invokes /board-run.
---

# Running the board

Load gh-sync too. The main agent orchestrates; the subagents do the work.

## Cycle
1. **Sample:** query every status per gh-sync. Take only tasks without an active agent label.
2. **Handling order:** first a P0 bug at any stage (R-025), then whatever is closest to done (In Review, In Testing, In Development, Ready for Dev, Test Design, Analysis & Spec), and only at the end a new pull. This keeps WIP from growing.
3. **WIP (R-021):** before every forward move, count the target status. In Development and In Testing up to 2, Awaiting Approval up to 3. If the target is full, the task stays: from Test Design it moves to Ready for Dev, and at other stages it stays without an agent label. A P0 bug bypasses the limit.
4. **Pull:** if there is room, get product-owner's proposed list (it receives the Backlog and the number of tasks in Awaiting Approval) and move the chosen tasks to Analysis & Spec.
5. **Dispatch to an agent:** per the status table in docs/sdlc/github-workflow.md. In Analysis & Spec: analyst, then architect, then ux-designer if there is UI. Give the agent the task description, previous comments and the relevant files.
6. **Document and move:** write the agent's report as a comment in the template, then move the status according to the report (forward, back or On Hold).
7. **Stop:** when a task reaches Awaiting Approval, show the owner the task summary and wait for their decision. Don't keep moving it. On Staging and Released only on the owner's explicit instruction (R-016, ADR-009).
8. **Release:** if all of the Milestone's tasks are On Staging, tell the owner the Milestone is ready for a Release. On their instruction, devops prepares a draft. Only the owner publishes and creates the tag (R-023).

## Run limits
- Up to 5 tasks or 5 moves in one run, then report. It can be run again.
- Stop at once if: there is no gh connection, a subagent returns an invalid report, or a manual action is needed (deploy, permissions, secrets, real data).
- Work runs in acceptEdits. In a session that touches infrastructure, permissions or deployment, switch to default (R-014).

## Summary at the end
A short list: what moved and where to, what is waiting for you (Awaiting Approval with links), what is blocked and why, and what was pulled from the Backlog.

## Continuous running
A Claude Code session does not run by itself. The run happens when the skill is invoked. A scheduled task could be considered later, but with real data and without the owner available it is not recommended.
