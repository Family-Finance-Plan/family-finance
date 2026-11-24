---
name: process-keeper
description: How to add, change or retire an SDLC rule, stage gate or agent responsibility. Use when the user says to add a rule, change a mandatory checkpoint, or reassign who is responsible for a step.
---

# Updating the SDLC process

## When the owner asks "add a rule: ..., at stage X, owned by Y"
1. Pick a new ID in docs/sdlc/rules.md (the next number in sequence, R-0xx).
2. Fill in: rule, stage, owner, enforcement, reason, date. Status is always `experimental` for a new rule (see rules.md for promotion to `established`).
3. Enforcement: if the rule is critical, it must have automatic enforcement (test, CI, hook or lint). If it has none, mark it "recommendation" and propose what to set up.
4. Update the owner's subagent file in .claude/agents/ if the rule changes its work.
5. If a lint rule, test or hook is needed, create a task for the developer or devops. Don't write that the rule is enforced before the enforcement exists.
6. Add a row to docs/sdlc/process-changelog.md.
7. Show the owner the change as a diff and get approval before merge.

## Changing a gate or stage
Update the table in docs/sdlc/process.md, and the section in CLAUDE.md if the principle there changes. CLAUDE.md stays under 200 lines. Details go to the docs files.

## Removing a rule
A rule that was not enforced for two cycles, or that has no reason, is proposed for removal in the iteration review (stage 8). Removing a rule without the owner's approval is forbidden.

## Sanity check before adding
Is there already a similar rule? Does the rule contradict an ADR? If so, stop and propose a new ADR.
