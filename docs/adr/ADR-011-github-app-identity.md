# ADR-011: A GitHub App as the agents' identity, in an organization

Status: Approved by the owner (2026-11-25). Replaces the bot user account set up on 2026-11-23 (docs/setup-checklist.md). Does not change R-016 or ADR-009.

## Context
The agents need a GitHub identity that is not the owner's, because on GitHub the author of a PR cannot approve it, and R-016 depends on the owner approving the agents' PRs. The first solution was a second user account (a "machine account"). On 2026-11-24 GitHub restricted that account after a burst of Issue creation: GraphQL limit 0, REST core limit 60, public profile hidden. The owner opened a GitHub Support ticket, with no answer after two days. Creating another user account while the first is restricted could be seen as getting around the restriction, which R-028 forbids.

At the same time, the old repo's public history held personal details (R-029), and cleaning it in place would have left the old commits reachable through PR refs until GitHub Support purged them.

## Decision
1. **Organization:** the repo lives in a free GitHub organization, `Family-Finance-Plan`, with the owner as its only owner. The repo was created there on 2026-11-25 from a history rewritten to remove personal details (R-029). The old repo on the owner's personal account is kept private until the owner deletes it.
2. **Identity:** the agents act as a GitHub App, `family-finance-agents`, created in the organization and installed on this repo only. Its commits and PRs appear as `family-finance-agents[bot]`.
3. **Permissions (least privilege):** repository Contents, Issues and Pull requests read and write; Metadata read; organization Projects read and write. No administration, no secrets, no workflows, no webhook.
4. **Board:** an organization Projects board (number 1). GitHub Apps cannot use boards owned by a personal account, which is the main reason for the organization.
5. **Credentials:** the App's private key is stored outside the repo, in a user-profile folder readable only by the owner's Windows user. The App ID, installation ID and key path are user environment variables `GH_APP_ID`, `GH_APP_INSTALLATION_ID` and `GH_APP_KEY_PATH`. `tools/gh-app-token.sh` turns them into an installation token that expires after one hour; the token is never written to a file, a log or the conversation (R-007).
6. **Git identity:** in the local repo, `user.name` is `family-finance-agents[bot]` and `user.email` is the App bot's GitHub noreply address.
7. The restricted bot user is no longer used. Its Support ticket stays open; if it is released, nothing changes. Its token (`GH_TOKEN`) is removed from the computer once the ticket is closed.

## Consequences
- The owner can approve the agents' PRs, so R-016 is enforceable through CODEOWNERS and the `protect-main` ruleset.
- Rate limits belong to the App installation (verified 5000 per hour for REST and GraphQL), not to a new user account, and Apps are GitHub's supported way to automate. R-028 pacing still applies.
- No password or 2FA for a second account to manage. The private key is the one secret; losing it means generating a new key in the App settings and deleting the old one.
- Tokens last one hour, so long runs get a fresh token from the script.
- Rulesets are not enforced on private repos on GitHub Free, in an organization as well. Until the repo is public again (ADR-009), R-016 and R-023 are guidance only. The rulesets must be recreated on the new repo; they did not move with the history.
- Issues and PRs from the old repo were not moved. Stories are recreated on the new board when needed, paced per R-028.

## Alternatives considered
- **Wait for GitHub Support:** no date, and the old repo's history would still need cleaning.
- **A new bot user account:** risks being treated as evasion while the first account is restricted.
- **The owner's own account:** the owner could not approve the agents' PRs (R-016).
- **Force-push the cleaned history to the old repo:** old commits stay reachable through PR refs until GitHub Support purges them, and the board would still need a user account.
