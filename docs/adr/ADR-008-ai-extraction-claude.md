# ADR-008: Document extraction with Claude

Status: Approved (provider). The specific model and confidence levels will be set from the test corpus.

## Decision
Claude is the AI provider for extracting transactions from PDF, CSV and images. It is used behind a single Provider interface, so the provider or model can be replaced in one place.

## Extraction step vs classification step
1. **Extracting facts from the document:** date, description or merchant name, amount, direction (debit/credit), currency and original amount, row or page number, and a confidence level for each field separately.
2. **Classification:** category is not an extraction field. It is determined from the merchant description, rules learned from the user and the AI's suggestion (FR-51 to FR-57, FR-65).

## Rules
- Validate the amount against the running balance on the row when a balance exists. The debit/credit direction is kept as a clear field.
- In credit card details keep both the transaction date and the charge date (transaction date for spending analysis, charge date for cash flow).
- Israeli documents: explicitly test reversed Hebrew text in PDFs, installment transactions and refunds.
- A test corpus of real documents with identifying details removed, including Hebrew PDFs, is a condition for setting confidence thresholds.
- The measurement is repeated on every model change. It is recommended to also compare one or two other providers before locking in.
- Check the API's data handling terms before uploading real data.

## Condition for revisiting
Extraction quality that does not meet the target on the test corpus, or a change in the data handling terms.
