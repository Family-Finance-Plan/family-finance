# Setup checklist: go through with the owner before the first real work

## Instruction for Claude Code
At the start of every session, as long as there is an item here not ticked [x], remind the owner in one line that this list is still open. When the owner is ready, go through the items with them step by step, one at a time, and explain simply what is done and why. The owner explicitly asked you to go through this with them, because the first explanation in the conversation was confusing. Tick [x] only after the owner confirms the item is done. Never ask the owner to paste a token or password into the conversation.

## What and why
On GitHub you cannot approve a PR you wrote yourself. If the agents work under the owner's account, they cannot approve the agents' work, and rule R-016, that only the owner approves, cannot be enforced. So the agents need a separate identity, and the main branch needs protection. Until this is set up, R-016 is guidance only, and uploading real data is forbidden.

## A separate identity for the agents (decision: an extra GitHub account, not an extra Claude subscription)
- [x] Read GitHub's terms of service on automation accounts, and confirm a bot account is allowed. If in doubt, the alternative is a GitHub App. Done 2026-11-23: GitHub ToS allows one machine account per person.
- [x] Create a bot account with a separate email and a name that explains what it is (the project name with bot). Done 2026-11-23: the bot account.
- [x] A strong, unique password, and two-factor authentication. Done 2026-11-23.
- [x] Invite it to the repo as a collaborator with Write permission only. Not Admin. Done 2026-11-23: invite accepted, permission `write` (personal-account repos have a single collaborator level, no admin).
- [x] Create a fine-grained token limited to this repo, with a short expiry (for example 90 days): read and write for contents, Pull requests and Issues, and permission for the Projects board. Check the exact way to grant Projects permission in GitHub's documentation at setup time. Done 2026-11-23 with a deviation: a **classic** token (scopes `repo`, `project`, 90 days; `read:org` added 2026-11-23 so `gh project` commands work), verified with gh (viewerPermission WRITE). A classic `repo` token reaches every repo the bot can access, so the bot must stay a collaborator on this repo only. Set a reminder to rotate it before it expires.
- [x] Store the token as an environment variable on the computer. Not in the repo, not in logs and not in the conversation. Done 2026-11-23: saved as the user environment variable `GH_TOKEN`.
- [x] Verify that `gh auth status` shows the bot, not the owner's account. Done 2026-11-23: `gh api user` returns the bot account.
- [x] Bot git identity: commits made by the agents are authored as the bot account (git `user.name` and the bot's GitHub noreply email), not as the owner. Done 2026-11-23: set in this repo's local git config (the bot's GitHub noreply address).
- [x] Bot access to the Projects board: add the bot account with Write in board Settings → Manage access, and verify the bot token can read and edit items. Done 2026-11-23: GraphQL as the bot reads the board and returns `viewerCanUpdate: true`. Note: `gh project ...` commands fail with "unknown owner type" under this token; see the /board-run item below.

## Protecting the main branch (this is what actually enforces R-016)
> **Temporary (2026-11-25):** the repo is private again while the bot account is blocked and the public history is cleaned (R-029). On GitHub Free, rulesets are not enforced on private repos, so `protect-main` and `protect-releases` are inactive and R-016 and R-023 are guidance only. Before making the repo public again, clean the history first.

- [x] Decide how Production approval is enforced. Decided (2026-11-23): stay on GitHub Free for now. Required reviewers on an Environment are not available on a private repo, so enforcement will be a tag ruleset (R-023, ADR-009).
- [x] (2026-11-23: The owner chose not to pay for Pro. The repo was made public instead, which gives rulesets for free; a deep scan found no secrets or family data, only the owner's commit email. Still open: the Tag ruleset on `v*`.) **Upgrade to GitHub Pro and set up a tag ruleset on `v*` that only the owner can create. Mandatory before real data, or before agents start opening PRs against `main`, whichever comes first.** Pro is also needed for the ruleset on `main` in the next item. Done 2026-11-23: `protect-releases` tag ruleset on `v*` is active (creation, update, deletion, force push restricted); only the Repository admin role bypasses it.
- [ ] Ruleset on `main`: PR required, at least one approval, required CI checks, and blocking direct pushes. (2026-11-23: `protect-main` is active: PR required, 1 approval, stale approvals dismissed, no deletion or force push, empty bypass list. Still open: required CI checks, once CI exists.)
- [x] A CODEOWNERS file that requires the owner's approval. (2026-11-23: `.github/CODEOWNERS` added; then turn on "Require review from Code Owners" in `protect-main`.) Done 2026-11-23: merged in PR #2, and "Require review from Code Owners" is on in `protect-main`.
- [x] Verify that the bot is not on the ruleset's bypass list, and that the owner as admin does not bypass it by accident either. Done 2026-11-23: `protect-main` bypass list is empty; `protect-releases` bypass is the Repository admin role only (the owner). The bot has Write, not admin.
- [x] Test it for real: the bot opens a PR, tries to merge without approval, and the attempt is blocked. Done 2026-11-23: PR #2 opened by the bot showed BLOCKED / REVIEW_REQUIRED until the owner approved. The bot did not attempt the merge itself (agents never merge without the owner's instruction).
- [ ] Render is configured to deploy only from `main`.

## Board and infrastructure
- [x] Create the repo and the Projects board, and fill in `<OWNER>/<REPO>` and `<PROJECT_NUMBER>` in the files. The names don't exist yet and the owner will provide them.
- [x] A Status field with the statuses in docs/sdlc/github-workflow.md, a Priority field, labels and Milestones.
- [ ] On the first /board-run, verify that the `gh` commands in gh-sync work, and fix what doesn't. (2026-11-23: first run on an empty board. After adding `read:org` to the bot token, `item-list` and `field-list` work and all Status and Priority IDs match gh-sync. Still untested: `item-edit`, until the first task exists.)

## Waiting for the owner's decision
- [x] Excel as input, the "transfer" transaction type, requirement priorities (docs/spec/spec-corrections.md, section D). Done 2026-11-24: Excel is D1, transfer is D2, and D17 says no per-requirement priorities in v0.1 (everything in scope is Must).
- [x] Whether process.md is version v0.1 with a mandatory review after every stage, and rules tagged as established or experimental. Done 2026-11-24: yes to all three (process.md, rules.md Status column, process-keeper and changelog updated).
- [ ] A test corpus of bank statements for extraction (R-013), and who prepares it. (2026-11-23: The owner will supply the examples. The repo is public, so they must be synthetic or fully redacted, and never committed with real data.)
