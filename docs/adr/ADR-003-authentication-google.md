# ADR-003: Authentication with Google

Status: Approved

## Decision
Sign-in with Google over OIDC. Authentication is isolated behind a single interface, so a provider can be added or replaced.

## Implementation rules
1. Identify the user by Google's stable identifier (the `sub` claim), not by email.
2. Accept only email addresses verified by Google.
3. An invitation to a household is made by email. The link is bound to the stable identifier at the first sign-in.
4. Session management on our side: short lifetime, automatic sign-out and sign-out from all devices.

## Limitations
- MFA is a personal setting in the Google account and cannot be enforced. Users are advised to turn on two-step verification, and re-authentication for sensitive actions (deletion, export) should be considered.
- Someone without a Google account cannot sign in. For the first phase this is reasonable.

## Condition for revisiting
A requirement for another provider, or a need to enforce MFA.
