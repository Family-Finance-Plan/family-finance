# ADR-004: Module boundaries

Status: Approved

## Decision
Two separate modules:
- **Cash Flow Core:** based on the bank statement. Transactions, cash flow, forecast, events, Dashboard.
- **Card Insights:** based on credit card details, with a separate CardTransaction entity. Optional.

## Iron rules
1. One-way relationship: Card Insights never feeds cash flow amounts.
2. A shared classification and learning engine, with one category and tag taxonomy for both modules (FR-51 to FR-57).
3. Soft link: every card transaction stores the last 4 digits, the charge date and the total charge amount.

## Consequences
- On the main dashboard the credit card charge appears as one row with the status "credit charge not itemized".
- Every category view states its coverage (for example "based on 62% of expenses").
- The schema leaves room for budget vs actual.

## Condition for revisiting
A need for detailed budget vs actual, or a move to open banking that also provides credit card details.
