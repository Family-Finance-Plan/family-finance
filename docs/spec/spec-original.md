# Spec: a platform for family financial management and planning
## A faithful record of the decisions and topics raised in the conversation

> This document reproduces only what was said and decided in the conversation. No new product requirements were added. Where a detail was not defined, it says "not defined".
>
> Labels in sections 4–9:
> - [decided] – said or explicitly approved.
> - [assumption] – a direction or proposal that was presented but not clearly closed.
> - [open] – not yet defined or requires a decision.
>
> Translated from the Hebrew original on 2026-11-24 (R-026). The Hebrew version is in git history. Category and label names here are working names; the Hebrew UI labels will live in the locale files.

# 1. Vision and problem

## 1.1 What the platform is

A generic web platform for managing, tracking, analyzing and planning the finances of a household/family. It is meant to be infrastructure that can be set up for different families, not a system coded for one family only.

The user will be able to define the household and its members, upload files containing income and expense data, get the transactions extracted and classified, correct and assign them, manage future events and changes, and see a snapshot and a financial forecast.

## 1.2 The problem the platform solves

The system is meant to give a family an organized picture of:

- Actual income and expenses.
- Where the money goes and in which categories.
- Which family member or party in the household each transaction belongs to.
- Financial assets, including investment portfolios and savings, alongside liabilities.
- Future events and changes that may affect the financial situation.
- The expected financial situation in the future, not only the current or historical one.

## 1.3 The value to the user

The main value is not only budget management or showing past expenses, but support for financial decisions: understanding where the family stands today, where it is expected to be in a year or two, and what the effect would be of changes in salary, a bonus, expenses, or decisions such as upgrading a car or buying an apartment.

The user wants to understand what they can afford right now, while understanding the effect of decisions on the future financial situation.

## 1.4 Product vision as phrased in the conversation

"Family Finance is a generic platform for family financial management and planning, combining the collection and analysis of financial data, learning the family's spending patterns, managing future events, and a simulation engine for decision making. Its goal is to let every household understand its current financial situation, anticipate its future situation, and make informed financial decisions based on data."

# 2. Users and roles

## 2.1 User types mentioned

### Household admin

- Manages all the data and the budget.
- Exact permissions: not defined.

### Partner

- Can view the data and update and classify transactions.
- Exact permissions: not defined.

### Additional user

- A user with limited permissions, for example a family member.
- Which actions exactly are allowed or forbidden: not defined.

## 2.2 Principles for users and households

- The system will support one household with several users. [decided]
- Each user must not be treated as a separate household. [decided]
- On the first screen / in the setup process the household members will be defined. [decided]
- The platform needs to be generic and duplicable / set up for another family in a few simple clicks. [decided]
- The user invitation process, identity verification, password reset, MFA, session management and granular permissions: not defined.

## 2.3 Example household members raised in the conversation

The example in the conversation used a real household (two parents and two children). Their names are not recorded here (R-029). Any names in examples are placeholders, not a hard-coded user list for any installation.

In addition, an assignment value "Family" or "Household" was proposed for a shared expense that does not belong to one person.

# 3. Scope

## 3.1 In scope

- A generic web platform for family financial management and planning. [decided]
- Setting up a household and defining its members. [decided]
- Support for several users in a household. [decided]
- Intake of files in PDF, CSV and image formats. [decided]
- Extracting financial transactions from files with AI. [decided]
- Duplicate checking and detecting duplicate files/transactions. [decided]
- A review and edit screen before transactions are taken into the system. [decided]
- Managing income and expenses, classifying into categories and tagging household members. [decided]
- Personal notes on transactions. [decided]
- Marking a transaction as one-off, while keeping it in the actual expense data. [decided]
- Learning from previous decisions and corrections and proposing to apply them to similar transactions. [decided]
- Searching and filtering transactions by period, family member/tag, category, type, amount and merchant. [decided at capability level; UI details open]
- Managing future financial events, expected changes and estimates. [decided]
- Financial forecasts for future horizons, including one and two years; the spec proposals also mentioned 3, 6 and 12 months and five years. [decided that the capability is needed; default horizons open]
- A central Dashboard screen with a Timeline, a chart and a transaction table. [decided]
- A distinction between cash flow / liquid money and the value of the investment portfolio and assets. [decided]
- An assets and liabilities module, including pensions, provident funds, study funds, investment portfolios, deposits, savings, bank accounts, real estate, mortgages and loans. [decided at domain level]
- What-If simulations and decision support, such as upgrading a car or buying an apartment. [decided]
- Addressing information security and user authentication as part of the spec. [decided that it must be addressed; details open]

## 3.2 Out of scope

No capabilities were explicitly defined as outside the product scope.

## 3.3 Deferred / set aside

- Detailed handling of transfers between accounts and preventing double counting. [deferred]
- Detailed handling of investments and securities, including how they are shown and classified in transactions. [deferred; later it was decided in principle to separate investment value from cash flow]
- A budget vs actual module – decided to defer until transactions are stable. [decided]
- The nature of the assistant/experience: a passive system, an active system or a combination – the user asked not to decide this early. [deferred]
- Full detail of the assets and liabilities module. [not yet detailed]
- Full detail of the forecasts and simulations module. [not yet detailed]
- Full detail of the information security and authentication module. [not yet detailed]
- Full detail of the user types and their permissions. [not yet detailed]
- Full detail of categories and subcategories. [not yet detailed]

## 3.4 Out of scope – clarification

No explicit decision was made to exclude a specific capability from the product scope. Section 3.3 refers to topics that were deferred or not yet detailed, not to a decision that they will not be in the product.

# 4. Functional requirements

Priority was not stated explicitly unless written otherwise. Where no explicit priority was given, it says "not defined".

## 4.1 Setup, users and households

- **FR-01 [decided]** – The system will allow setting up a new household. Priority: not defined.
- **FR-02 [decided]** – On the first screen / in the setup process the user will be able to define the household members. Priority: not defined.
- **FR-03 [decided]** – The system will support several users under the same household. Priority: not defined.
- **FR-04 [decided]** – The system will support at least these user types: household admin, partner, and an additional user with limited permissions. Priority: not defined.
- **FR-05 [decided]** – The platform will be generic and allow setting up / duplicating an installation for another family in a few simple clicks. Priority: not defined.
- **FR-06 [open]** – Detailed permissions for each user type. Priority: not defined.

## 4.2 Document intake

- **FR-07 [decided]** – The user will be able to upload files containing income and expense details. Priority: not defined.
- **FR-08 [decided]** – The platform will support PDF, CSV and image files. Priority: not defined.
- **FR-09 [decided]** – The user will be able to upload a file without first having to choose a specific document type such as a bank statement or credit card details; the document type must not restrict the upload itself. Priority: not defined.
- **FR-10 [decided]** – The system will identify the file/document type and try to understand its content. Priority: not defined.
- **FR-11 [decided]** – The system will check for duplicate files or transactions before intake. Priority: not defined.
- **FR-12 [decided]** – The system will show errors or transactions that could not be parsed. Priority: not defined.
- **FR-13 [decided]** – After the data is extracted, the user will be shown a review view before the transactions enter the system. Priority: not defined.
- **FR-14 [decided]** – Only after the user's approval will the transactions enter the system. Priority: not defined.
- **FR-15 [decided]** – A log/record of every upload will be kept. Priority: not defined.
- **FR-16 [decided]** – On the review screen the user will be able to correct transaction details, including amount and description, as needed. Priority: not defined.
- **FR-17 [decided]** – On the review screen the user will be able to change the category of each transaction. Priority: not defined.
- **FR-18 [decided]** – On the review screen the user will be able to change the tags / household-member assignment of each transaction. Priority: not defined.
- **FR-19 [decided]** – On the review screen the user will be able to mark a transaction as one-off. Priority: not defined.
- **FR-20 [open]** – How the AI extraction's confidence level is shown, the confidence thresholds and the automatic action at each level. Priority: not defined.

## 4.3 Data extraction with AI

- **FR-21 [decided]** – The system will extract transactions from the uploaded document. Priority: not defined.
- **FR-22 [decided]** – The system will identify at least the date, description/merchant name or source, amount and transaction type, as far as the information exists in the document. Priority: not defined.
- **FR-23 [decided]** – The system will attach a confidence level to every extracted transaction. Priority: not defined.
- **FR-24 [decided]** – Low-confidence transactions will go to the review screen before final approval. Priority: not defined.
- **FR-25 [decided]** – The user will be able to see rows that were not parsed and correct or add information by hand. Priority: not defined.
- **FR-26 [open]** – How a document that is unreadable or unsupported is handled. Priority: not defined.

## 4.4 Managing financial transactions

- **FR-27 [decided]** – The system will show a central screen of all the transactions received from all documents. Priority: not defined.
- **FR-28 [decided]** – The transaction list will include: date, description, amount, type (income/expense), category, tags / household-member assignment and a one-off marker. Priority: not defined.
- **FR-29 [decided]** – The user will be able to edit any field directly from the transaction list. Priority: not defined.
- **FR-30 [decided]** – The user will be able to change a transaction's category. Priority: not defined.
- **FR-31 [decided]** – The user will be able to change a transaction's tags/assignment. Priority: not defined.
- **FR-32 [decided]** – The user will be able to mark a transaction as one-off. Priority: not defined.
- **FR-33 [decided]** – The user will be able to delete a transaction. Priority: not defined.
- **FR-34 [decided]** – The user will be able to select several transactions and bulk edit them. Priority: not defined.
- **FR-35 [decided]** – Transactions can be filtered by period. Priority: not defined.
- **FR-36 [decided]** – Transactions can be filtered by family member/tag. Priority: not defined.
- **FR-37 [decided]** – Transactions can be filtered by category. Priority: not defined.
- **FR-38 [decided]** – Transactions can be filtered by transaction type. Priority: not defined.
- **FR-39 [decided]** – Transactions can be filtered by amount. Priority: not defined.
- **FR-40 [decided]** – Transactions can be filtered by merchant. Priority: not defined.
- **FR-41 [decided]** – A transaction can be assigned to more than one family member, using labels/tags. Priority: not defined.
- **FR-42 [decided]** – There will be a general tag/label "Family" or "Household" that represents a shared expense of everyone. Priority: not defined.
- **FR-43 [decided]** – Every transaction will have one category, and alongside it one or more tags can be set for whom the transaction belongs to. Priority: not defined.
- **FR-44 [decided]** – Every transaction can have a personal note added. Priority: not defined.
- **FR-45 [decided]** – Personal tags/labels can be added and a transaction can be assigned to a family goal. Priority: not defined.
- **FR-46 [assumption]** – Changing a category or tags will be done by quick editing, similar to editing a label in email. The user agreed with the general direction, but the number of clicks is not an explicit acceptance requirement. Priority: not defined.

## 4.5 One-off items, classification and learning

- **FR-47 [decided]** – The user will be able to mark an expense as one-off. Priority: not defined.
- **FR-48 [decided]** – A one-off expense will stay in the actual expense data and will not be removed from the analysis. Priority: not defined.
- **FR-49 [decided]** – The system will distinguish between actual expenses and normalized recurring expenses, in which one-off events do not affect the recurring spending pattern. Priority: not defined.
- **FR-50 [decided]** – The user will be able to decide whether a one-off expense is included in the relevant category's budget or managed in a separate budget. Priority: not defined.
- **FR-51 [decided]** – The system will keep the user's previous decisions on classification, assignment and exclusion of transactions. Priority: not defined.
- **FR-52 [decided]** – The system will detect new transactions that are similar to transactions the user previously excluded or classified in a certain way. Priority: not defined.
- **FR-53 [decided]** – When a similar transaction is detected, the system will ask the user whether to apply the same previous decision. Priority: not defined.
- **FR-54 [decided]** – The user will be able to approve, reject, or ask to be asked again each time. Priority: not defined.
- **FR-55 [decided]** – The system will distinguish between a one-time decision about a transaction and a recurring preference/rule about a pattern of transactions. Priority: not defined.
- **FR-56 [decided]** – The user will be able to change or cancel a previous decision. Priority: not defined.
- **FR-57 [decided]** – The system will keep a history of decisions. Priority: not defined.
- **FR-58 [assumption]** – The system will not automatically apply a previous decision to every similar transaction, but will show a suggestion for the user's approval. This is how the direction was presented in the conversation; a full automation policy was not defined. Priority: not defined.

## 4.6 Categories, income and expenses

- **FR-59 [decided]** – Transactions will be classified into categories and subcategories. Priority: not defined.
- **FR-60 [decided]** – There will be a distinction between income and expenses. Priority: not defined.
- **FR-61 [assumption]** – Initial expense categories proposed:
  - Housing and home maintenance.
  - Food and shopping.
  - Children and family.
  - Transport and car.
  - Health and wellbeing.
  - Personal consumption.
  - Leisure and entertainment.
  - Financial expenses.
  - Other.
  Priority: not defined.
- **FR-62 [assumption]** – Subcategories proposed:
  - Housing and home maintenance: mortgage, municipal tax (arnona), electricity, water, gas, building committee, maintenance and repairs.
  - Food and shopping: supermarket, household shopping, restaurants, deliveries, cafes.
  - Children and family: education settings, after-school activities, clothing, toys, baby equipment, children's health.
  - Transport and car: fuel, insurance, servicing, annual vehicle test, parking, public transport.
  - Health and wellbeing: medicines, doctors, insurance, treatments, gym.
  - Personal consumption: clothing, footwear, grooming, hairdresser, electrical goods and electronics.
  - Leisure and entertainment: vacations, trips, shows, hobbies, subscriptions.
  - Financial expenses: bank fees, interest, management fees, loan repayments.
  - Other: not yet classified expenses, special expenses and miscellaneous expenses.
  Priority: not defined.
- **FR-63 [assumption]** – Income categories proposed:
  - Salary for each household member separately.
  - Income from a business or additional work.
  - Allowances and benefits.
  - Rental income.
  - Investment income.
  - Refunds and credits.
  - One-off income.
  Priority: not defined.
- **FR-64 [decided]** – The user will be able to change an automatic classification and create their own categories and subcategories. The capability was proposed and adopted as part of the direction, but the details of category management were not specified. Priority: not defined.
- **FR-65 [decided]** – The system will learn from previous classification corrections and improve future classifications. Priority: not defined.

## 4.7 Future income and financial events

- **FR-66 [decided]** – The system will allow defining a future financial event. Priority: not defined.
- **FR-67 [decided]** – An event can be given an expected amount and date. Priority: not defined.
- **FR-68 [decided]** – An event can be marked with a certainty level: verified, expected, estimate or scenario. Priority: not defined.
- **FR-69 [decided]** – An expected future bonus can be defined, including date and amount. Priority: not defined.
- **FR-70 [decided]** – An expected change in salary/income can be defined, including the date the change starts. Priority: not defined.
- **FR-71 [decided]** – A planned future expense can be defined. Priority: not defined.
- **FR-72 [decided]** – A previous income/expense value can be kept and not overwritten when a new value is updated. Priority: not defined.
- **FR-73 [decided]** – For every change in income or expense the system will keep the effective start date, the end date if any, the previous and new value, the information source, the certainty level and user notes. Priority: not defined.
- **FR-74 [decided]** – The system will distinguish between an actual financial figure and a planned financial figure. Priority: not defined.
- **FR-75 [decided]** – The system will be able to compare, in retrospect, a forecast with what actually happened. Priority: not defined.
- **FR-76 [decided]** – The system will be able to save several scenarios and compare them. Priority: not defined.
- **FR-77 [assumption]** – Three forecast types were proposed:
  - A base forecast based on verified data.
  - An expected forecast that includes expected events.
  - An extended forecast that includes estimates and scenarios.
  Priority: not defined.
- **FR-78 [decided]** – The system will be able to show forecasts for future time horizons; the conversation mentioned one year, two years, 3, 6 and 12 months, and five years. Priority: not defined; the choice of default horizons is open.
- **FR-79 [assumption]** – The system will show alerts about upcoming events or expected changes. Priority: not defined.

## 4.8 Dashboard and Timeline

- **FR-80 [decided]** – The main screen will be a financial Dashboard. Priority: central to the product vision; formal priority not defined.
- **FR-81 [decided]** – At the top of the Dashboard a Timeline chart over time will be shown. Priority: not defined.
- **FR-82 [decided]** – The Timeline will show past data and a future forecast, with the current point in time clearly marked. Priority: not defined.
- **FR-83 [decided]** – The chart will show financial rises and falls during the month and the outlook ahead. Priority: not defined.
- **FR-84 [decided]** – The Timeline can be grouped by months. Priority: not defined.
- **FR-85 [decided]** – The monthly view will be collapsible (can be expanded and collapsed). Priority: not defined.
- **FR-86 [decided]** – Below the chart a table of the transactions that have happened so far in the month will be shown. Priority: not defined.
- **FR-87 [decided]** – The transaction table will show at least date, description, amount, category and tags. Priority: not defined.
- **FR-88 [decided]** – There will be a row/marker representing today and the future events in the coming month. Priority: not defined.
- **FR-89 [decided]** – The user will be able to edit a future amount for a specific month, for example a future salary. Priority: not defined.
- **FR-90 [decided]** – When the user changes a future amount, the system will ask whether to save the change or create a temporary estimate only. Priority: not defined.
- **FR-91 [assumption]** – Showing the current balance, expected income and expenses until the end of the month, and the forecast balance at the end of the month was proposed. The full component layout was not explicitly approved. Priority: not defined.
- **FR-92 [decided]** – The user will be able to edit future values from the Dashboard/Timeline screen. Priority: not defined.

## 4.9 Assets, investments and liabilities

- **FR-93 [decided]** – The system will manage financial assets, including pensions, provident funds, study funds, investment portfolios, deposits, savings and bank accounts. Priority: not defined.
- **FR-94 [decided]** – The system can also include real estate and other assets. Priority: not defined.
- **FR-95 [decided]** – The system will manage liabilities such as mortgages, loans, credit obligations and balances due. Priority: not defined.
- **FR-96 [decided]** – The system will show total asset value, total liabilities and the family's equity/net worth. Priority: not defined.
- **FR-97 [decided]** – The investment portfolio will be shown separately from cash flow, because its value changes daily. Priority: not defined.
- **FR-98 [decided]** – The investment portfolio's value will be shown at the last known current value. Priority: not defined.
- **FR-99 [decided]** – Daily changes in the investment portfolio's value will not count as income or expense. Priority: not defined.
- **FR-100 [decided]** – Transferring money from the current account to an investment portfolio will not count as an expense. How the transfer is actually detected is deferred. Priority: not defined.
- **FR-101 [decided]** – The system will separate liquid/available money from total capital/financial assets. Priority: not defined.
- **FR-102 [assumption]** – Showing three layers was proposed: liquid balance; investment portfolio; total family capital (assets minus liabilities). Priority: not defined.
- **FR-103 [open]** – How often investment portfolio values are updated, the source of the value data, and how to connect to financial institutions. Priority: not defined.

## 4.10 Planning, simulations and decision making

- **FR-104 [decided]** – The system will allow What-If simulations. Priority: not defined.
- **FR-105 [decided]** – Income changes, expense changes and one-off bonuses can be examined. Priority: not defined.
- **FR-106 [decided]** – Several scenarios can be compared side by side. Priority: not defined.
- **FR-107 [decided]** – The system will show the effect of the scenarios on future savings and capital. Priority: not defined.
- **FR-108 [decided]** – The system will help examine the financial ability to buy a car or an apartment. Priority: not defined.
- **FR-109 [assumption]** – For buying a car/apartment, an analysis of net income, recurring expenses, liabilities, liquid capital, future events and the level of risk the family is willing to take was proposed. Priority: not defined.
- **FR-110 [assumption]** – For buying a car/apartment, showing a recommended purchase range, the monthly effect and alternative scenarios was proposed. Priority: not defined.
- **FR-111 [decided]** – Forecasts and simulations will show assumptions, certainty levels and sensitivity to changes; a forecast must not be presented as a promise. Priority: not defined.

## 4.11 Budget

- **FR-112 [decided]** – A monthly family budget module and a budget by category were mentioned. Priority: not defined.
- **FR-113 [decided]** – Comparing the planned budget with actual spending was mentioned. Priority: deferred until transactions are stable.
- **FR-114 [decided]** – It can be set whether a one-off expense is included in the category budget or managed in a separate budget. Priority: not defined.
- **FR-115 [open]** – Full detail of the budget module, how a budget is created, update frequency, alerts and overruns. Priority: not defined.
# 5. Non-functional requirements

- **NFR-01 [open] Performance:** response times for loading the Dashboard, search, filtering, file upload and AI extraction – not defined.
- **NFR-02 [open] Performance:** maximum file size, maximum number of transactions and allowed processing time – not defined.
- **NFR-03 [open] Information security:** the user explicitly asked to address information security and authentication. The identification mechanism, password policy, MFA, encryption, key management, permissions and file access – not defined.
- **NFR-04 [open] Permissions:** it must be defined who may view, upload, edit, delete and approve transactions, events and data. The exact permission model – not defined.
- **NFR-05 [open] Privacy and data isolation:** the platform is generic and supports different households. How households are isolated from each other (multi-tenancy), including preventing cross-household access – not defined.
- **NFR-06 [open] Availability:** availability target, maintenance windows, backup, restore and disaster recovery – not defined.
- **NFR-07 [open] Scalability:** expected number of households, users, transactions and files – not defined.
- **NFR-08 [open] Auditability:** a log of uploads is kept, and a history of decisions/changes was mentioned. The full scope of the audit log, its retention and who can view it – not defined.
- **NFR-09 [open] Data reliability:** confidence levels must be shown for extracted data, and future data must be marked by its degree of certainty. Accuracy thresholds or an allowed error rate – not defined.
- **NFR-10 [open] Regulatory compliance:** legal/regulatory requirements, data retention periods, data deletion, data storage location and security standards – not defined.
- **NFR-11 [open] Usability:** the user asked for a focused, purposeful and practical process, and a UI that allows correcting assignment and category quickly and in the same window. Formal usability metrics – not defined.
- **NFR-12 [open] Accessibility and languages:** language support, RTL, accessibility and WCAG standards – not defined.
- **NFR-13 [open] Compatibility:** supported browsers, devices and resolutions – not defined.

# 6. Data model

The entities below are those that came up explicitly or follow directly from the requested features. Schemas, types, keys, integrity constraints and table names were not defined.

## 6.1 Main entities

- **Household:** the family data unit. Contains users, household members, transactions, categories, tags, events, assets and liabilities.
- **User:** a person who signs in to the system. Linked to a household and given a role/permissions.
- **Household Member:** a person a transaction can be assigned to. It was not defined whether every household member must also be a User.
- **Role (role and permissions):** household admin, partner, additional user with limited permissions. Permission details not defined.
- **Financial Document:** an uploaded file, in PDF, CSV or image format.
- **Upload Log:** a record of a file upload.
- **Transaction:** an income or expense that includes at least date, description, amount, type, category and tags/assignments; it can include a note and a one-off marker.
- **Category:** a classification of a transaction; categories and subcategories were mentioned.
- **Tag / Label:** one or more assignments to household members or a group, including "Family"/"Household".
- **Transaction Note:** a personal note attached to a transaction.
- **Classification Decision:** a user's decision on the category, assignment, one-off status or handling of a transaction.
- **Classification Rule:** a preference or rule learned from the user's decisions and proposed for similar transactions.
- **Financial Event:** a future event or expected change, such as a bonus, a salary change or a planned expense.
- **Forecast:** a calculation of the future financial situation based on past data, verified data, expected events and estimates.
- **Scenario:** a set of assumptions for changing income/expenses and comparing outcomes.
- **Asset:** a bank account, investment portfolio, deposit, savings, pension, provident fund, study fund, real estate or other asset.
- **Liability:** a mortgage, loan, credit obligation or balance due.
- **Asset Valuation:** the current / last known value of an asset, in particular an investment portfolio.
- **Budget:** a monthly budget or a budget by category; the module is deferred until transactions are stable.

## 6.2 Relationships between entities

- One Household includes several Users. [decided]
- One Household includes many household members. [decided]
- A Transaction belongs to one Household. [assumption that follows directly from the household model; implementation not defined]
- A Transaction is assigned to one category. [decided]
- A Transaction can be assigned to one or more Tags, including several household members and a family tag. [decided]
- A Transaction can be linked to the Financial Document it was extracted from. [assumption; the exact relationship not defined]
- A Financial Document can contain many transactions. [assumption that follows from the extraction process; relationship rules not defined]
- A Transaction can include a note and a one-off marker. [decided]
- A Classification Decision can affect the classification/assignment of a Transaction and feed a recurring rule. [decided at behavior level]
- A Financial Event can affect a Forecast and a Scenario. [decided at behavior level]
- A Scenario contains different assumptions and is used to compare forecast outcomes. [decided]
- A Household holds Assets and Liabilities. [decided at domain level]
- An Asset can include a last known current value. [decided]
- A Budget is linked to categories and actual transactions for comparison, but the details were not defined. [open]

## 6.3 Fields not defined

Identifiers, exact field names, date formats, currency, time zone, full version history, soft delete, document retention policy, linking transactions to transfers, the relationship between a user and a household member, and multiple currencies – not defined.

# 7. Integrations and external systems

- **INT-01 [open]** – The data sources are files the user uploads themselves, in PDF, CSV and image formats.
- **INT-02 [open]** – No direct connection to banks, credit card companies, investment houses, insurance companies or pension bodies was defined.
- **INT-03 [open]** – No OCR or Document AI provider for extracting information from PDFs and images was defined.
- **INT-04 [open]** – No AI provider/model for classification, extraction, pattern detection or learning from user corrections was defined.
- **INT-05 [open]** – No external source for securities prices or investment portfolio values was defined.
- **INT-06 [open]** – No connection to external authentication services such as Google, Microsoft or another identity provider was defined.
- **INT-07 [open]** – No messaging, email, SMS or push notification service was defined.
- **INT-08 [open]** – No integration with other accounting, tax, budgeting or financial planning systems was defined.

# 8. Technology and architecture

- **ARCH-01 [decided]** – The product will be a web platform.
- **ARCH-02 [decided]** – The product will be generic and multi-household, not a single-family solution.
- **ARCH-03 [decided]** – AI will be used to extract and analyze data from files, classify transactions and help detect patterns. Provider, model and AI architecture not defined.
- **ARCH-04 [assumption]** – The document intake process will include upload, parsing/extraction, duplicate detection, a review screen, user correction and intake approval. This is the functional flow that was discussed; the technical implementation was not defined.
- **ARCH-05 [decided]** – The system will keep a history of decisions and changes related to classification and future data.
- **ARCH-06 [decided]** – The system will logically separate cash flow from changing asset values, in particular the investment portfolio.
- **ARCH-07 [open]** – Programming language, frontend framework, backend framework, database, hosting, cloud provider, file storage infrastructure and API – not defined.
- **ARCH-08 [open]** – Multi-tenancy architecture: a shared database with a tenant ID, a separate database per household, or another option – not defined.
- **ARCH-09 [open]** – Architecture of permissions, authentication, authorization, encryption and secrets management – not defined.
- **ARCH-10 [open]** – Design of the forecast engine, simulation engine, cash flow calculations and asset valuation – not defined.
- **ARCH-11 [open]** – CI/CD process, Development/Staging/Production environments, monitoring, logging and alerting – not defined.

# 9. Constraints and assumptions

- **[decided]** The platform needs to be generic and support different households.
- **[decided]** Different users can be members of the same household.
- **[decided]** The user does not need to choose a specific document type before uploading the file.
- **[decided]** The input formats mentioned are PDF, CSV and images.
- **[decided]** Extracted transactions do not enter the system without a user review/approval step.
- **[decided]** Every transaction has one category and can be assigned more than one tag / more than one household member.
- **[decided]** A one-off transaction stays in the history and in actual expenses; the marker is meant to distinguish it from the recurring pattern.
- **[decided]** Future data can be verified, expected or estimate, and the certainty levels must not be mixed.
- **[decided]** Changes in income/expense over time must keep the history and not overwrite previous values.
- **[decided]** The investment portfolio's value changes daily and is not income/expense cash flow.
- **[decided]** A historical/future forecast must be shown on the Timeline, with the present point marked.
- **[decided]** Editing future amounts from the Dashboard must be allowed, distinguishing between saving a change and a temporary estimate.
- **[decided]** The user wants to move forward with a focused and purposeful spec, without unnecessary questions and long explanations.
- **[assumption]** Files may contain data from different financial sources; exact detection of every institution/format was not defined.
- **[assumption]** Past data will be used as the basis for estimating future expenses and income, but the forecast formula was not defined.
- **[open]** Base currency, foreign currency support, exchange rates and taxation – not defined.
- **[open]** Backup, restore, document retention and data deletion policy – not defined.
- **[open]** Legal and regulatory limitations, including privacy and security of financial information – not defined.
- **[open]** How data from external financial sources is connected – not defined.

# 10. Decisions made

| Topic | Decision | Reason raised in the conversation | Alternatives rejected / not chosen |
|---|---|---|---|
| Nature of the product | A generic web platform for households | The ability to set up the platform for different families | A dedicated single-family system |
| User structure | Several users under one household | Shared management of the family unit | A separate household for every user |
| Assigning transactions | Labels/tags, one or more | A transaction can be shared or belong to several household members | Exclusive assignment to a single person only |
| Family tag | A general "Family"/"Household" label | Representing a transaction shared by everyone | No rejected alternative defined |
| Category | One category per transaction | Distinguishing the type of expense from whom it belongs to | Multiple categories per transaction not chosen |
| Editing a transaction | Category and assignment can be corrected in the same window | The user asked not to settle for a one-time classification but to allow correcting both dimensions together | Separate screens for each change not chosen |
| Document intake | Upload a file without choosing a document type in advance | The file/document type should not restrict the user | Choosing a document type as a condition for upload |
| Intake approval | A review screen before intake | The extracted data must be verified as correct | Automatic intake without approval not chosen |
| One-off expenses | Keep them in actuals and mark them as one-off | Don't lose history, but don't distort the recurring pattern | Deleting or completely ignoring the expense |
| Future events | Distinguish between verified, expected and estimate | A bonus or salary change may be expected but not certain | Treating all future data as certain |
| Salary history | Keep previous values and effective dates | For example, a previous salary until a certain date and a new salary from another date | Overwriting the old salary |
| Editing the forecast on the Dashboard | Ask whether to save a change or create a temporary estimate | The user may want to test a one-time change without changing a fixed figure | Applying every change automatically as a fixed figure |
| Investments on the chart | Separate investment value from cash flow | Portfolio value changes day to day, for example X and then X minus 200, and is not income/expense | Showing changes in portfolio value as recurring income/expense |
| Budget vs actual | Defer until transactions are stable | Classified, accurate transaction data must be established first | Starting the spec with budget vs actual |
| Main screen design | A Dashboard with a Timeline on top and a transaction table below | The user wants to understand past, present and outlook on the same screen | A main screen showing only charts or only a transaction list |

# 11. Open questions and contradictions

## 11.1 Open questions

1. **Authentication:** how will users sign in? Email and password, SSO, an external provider or other options?
2. **MFA:** is multi-factor authentication required?
3. **Authorization:** what exactly can each role see, add, edit, delete and approve?
4. **Multi-tenancy:** how will complete isolation between households be ensured?
5. **Information security:** which data will be encrypted in transit and at rest? How will keys and secrets be stored?
6. **Audit log:** which actions will be recorded beyond uploads and classification decisions?
7. **Deleting a user/household:** what happens to the data when a user leaves a household or when a household is deleted?
8. **Files:** what is the maximum file size, how many files can be uploaded together, and what is the source retention policy?
9. **Duplicates:** what is the detection rule – file identity, date/amount/merchant or a combination?
10. **AI:** which model or provider will perform extraction and classification? How will confidence levels be shown?
11. **Approving transactions:** do all transactions require approval, or only low-confidence ones?
12. **Recurring income and expenses:** how is a recurring transaction detected and what is the periodicity prediction mechanism?
13. **Internal transfers:** how is a transfer between accounts of the same household detected and prevented from counting as income/expense?
14. **Investments:** where will the investment portfolio's value come from and how often will it be updated?
15. **Liabilities:** how will mortgage/loan balances be entered, and will they be updated by hand or from an external source?
16. **Forecasts:** what is the calculation mechanism, which data is included at each certainty level, and what is the default horizon?
17. **Scenarios:** is a scenario a copy of a forecast with changes, or an independent entity?
18. **Dashboard:** what exactly is the financial measure on the chart's Y axis – cash balance, net worth or another measure?
19. **Timeline:** what is the level of detail – daily, weekly or monthly? Monthly grouping was mentioned but the axis granularity was not defined.
20. **Budget:** what is the full structure of a monthly budget, a budget by category, and overruns?
21. **Categories:** will the proposed category list be a fixed default or fully customizable?
22. **Currency:** will the system support one currency or several?
23. **Alerts:** will there be alerts, on which channel and under which conditions?
24. **Reports and export:** will the user be able to export data or reports? Not defined.
25. **Regulation:** which privacy, security and compliance requirements apply to the product? Not defined.

## 11.2 Ambiguities or tensions in the spec

- **History vs forecast:** the Dashboard is supposed to show past and future on the same Timeline, but it was not defined whether the value axis represents a balance, cumulative cash flow or another measure.
- **Investments vs cash flow:** it was decided to show investments separately from cash flow, but it was not defined how they will be shown together on the combined chart or how family capital will be calculated.
- **One-off expense:** it was decided that it stays in actual expenses, but also that normalized expenses are not affected by it. The exact calculation rules were not defined.
- **Certainty levels:** "verified", "expected", "estimate" and "scenario" were mentioned, but it was not defined whether these are event statuses, data sources, or separate forecast levels.
- **Base/expected/extended forecast:** a split into three forecasts was proposed; it was not defined whether it is the same as the statuses above or a separate layer.
- **Classification correction vs learning:** the system is supposed to learn from corrections, but also to ask before applying a recurring decision. It was not defined when a rule is considered certain enough to propose.
- **User vs household member:** it was not defined whether every household member is a user with an account, or whether household members who don't sign in can be managed.
- **Category vs label:** one category and more than one label were decided; it was not defined whether labels can also represent goals/projects that are not household members.
- **Budget:** a budget module was mentioned, but it was decided to defer the detail until transactions are stable.
- **Assets:** the scope of assets is broad, but the module itself was not detailed to the level of screens and fields.
- **Update frequency:** investment data changes daily, but it was not defined whether the user enters it by hand, uploads a file or connects to an external source.

# 12. Glossary

| Term | Meaning as used in the conversation |
|---|---|
| Household | The family unit whose financial data is managed in the system |
| User | A person who signs in to the system |
| Household Member | A person in the household that a transaction can be assigned to |
| Transaction | A single income or expense |
| Category | A financial classification of a transaction, for example food or housing |
| Subcategory | A more detailed classification within a category |
| Label / Tag | A flexible label for assigning a transaction to one or more people, or to the family |
| One-time Expense | An expense kept in history but marked as not recurring |
| Normalized Expenses | A view of recurring expenses that is not affected by one-off events |
| Document Ingestion | Uploading files, parsing them and producing transactions |
| OCR | Recognizing text from an image or scanned document; no provider chosen |
| AI Extraction | Using AI to identify transactions and data in files |
| Confidence | The system's estimate of how certain it is about a value it extracted or classified |
| Duplicate Detection | Finding files or transactions that were already taken in |
| Authentication | Verifying the user's identity at sign-in |
| Authorization | Determining the actions and data a user is permitted to access |
| MFA | Multi-factor authentication |
| Multi-Tenancy | Supporting several households in the system while isolating their data from each other |
| Audit Log | A record of actions and changes for tracking purposes |
| Financial Event | A future event that affects income or expenses |
| Expected | A future value the user expects to happen, but that is not completely certain |
| Estimate | An approximate value that is not necessarily based on a commitment |
| Scenario | A set of assumptions for examining a possible financial situation |
| Forecast | A calculation of a future financial situation |
| What-If | A simulation of changing assumptions and checking its effect |
| Timeline | A time axis showing the past, the present point and the future forecast |
| Dashboard | A central screen showing a snapshot and the main data |
| Collapsible | An area that can be expanded and collapsed, for example monthly grouping |
| Cash Flow | The movement of money in and out over time |
| Liquid Balance | Money available for day-to-day use |
| Investment Portfolio | Financial assets whose value changes over time |
| Net Worth | Asset value minus liabilities |
| Liability | A debt or amount due, such as a mortgage or loan |
| Budget vs. Actual | Comparing a planned budget with actual spending |
| Tenant | An isolated household/customer within the multi-tenancy architecture |

# 13. Other items raised in the conversation that are not in the sections above

- The user asked for the spec discussion to be focused, purposeful and practical, without long explanations and unnecessary questions.
- The user asked to move between modules and consolidate the spec into a detailed document that can be handed to a development tool to build the platform.
- The user made clear there is no need to bother them with questions about the file type the customer will upload; as far as they are concerned the user can upload Excel, CSV, PDF and so on. Later PDF, CSV and images were listed as the formats mentioned.
- The user stressed that classifying a transaction once is not enough: the same window must allow correcting both the transaction's household-member assignment and its category.
- The user stressed that every transaction has two separate dimensions: category and whom it belongs to.
- The user proposed labels, with the option of more than one label, plus a general label representing the whole family.
- The user asked for a main screen that is a Dashboard, with charts alongside numeric data.
- The user asked for a Timeline that shows what has happened up to today and what is expected ahead, including income and expenses.
- The user asked for the ability to group the data by month and expand/collapse each month.
- The user asked that on the same screen it be possible to edit the amount of a future event or income, and that the system ask whether to save the change or keep it as a temporary estimate.
- The user raised a question about showing the investment portfolio on the chart, because its value can change daily, for example X one day and X minus 200 the next.
- Following the discussion about the investment portfolio, the chosen direction was to separate recurring cash flow from investment value, and not to show daily fluctuations in portfolio value as income or expense.
- The user gave examples of decisions the platform should help with: whether a car can be upgraded or an apartment bought.
- The user mentioned future scenarios such as a change in the partner's salary, receiving a bonus, or a change in income, and asked to see where the family will be in a year or two under each scenario.
- The user asked that the system clearly mark whether a future value is expected or only an estimate, and not treat an estimate as if it were certain.
- The user asked to keep a history of changes, for example which salary was in effect until a certain date and from which date a new salary applies.
- No final product name was decided in the conversation.
- No decision was made in the conversation on language, framework, cloud provider, database or development tools.
- No decision was made in the conversation on an AI provider or an OCR provider.
