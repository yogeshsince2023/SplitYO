# MASTER PROJECT PROMPT: Build SplitMate, an AI-Powered Shared Expense Management Platform

## 1. Your Role

Act as a senior product architect, full-stack engineer, mobile application developer, UI/UX designer, database architect, security engineer, and product strategist.

Your task is to design and build **SplitMate**, a modern, production-ready shared expense management platform inspired by Splitwise, Tricount, Settle Up, and Splid.

Do not simply clone an existing application. Study the strongest capabilities of established expense-sharing products, combine their best ideas, identify gaps in the existing user experience, and create a differentiated product.

The goal is to build a trustworthy, intuitive, scalable, and affordable application for managing shared expenses among friends, roommates, couples, families, travel groups, students, and office teams.

Do not begin by generating the entire codebase blindly. First understand the requirements, propose the architecture, establish the development plan, and then implement the application incrementally.

---

## 2. Product Vision

Build one platform where users can:

- Record shared expenses in seconds.
- Split bills fairly between multiple people.
- Track who owes whom.
- Minimize the number of repayments required.
- Manage recurring household bills.
- Organize expenses for trips, homes, events, and teams.
- Scan receipts and automatically extract expense details.
- Use AI-assisted voice and text expense entry.
- Track spending, budgets, and financial trends.
- Record payments made through cash, bank transfers, UPI, and other external methods.
- Access their expense records through web, Android, and iOS applications.

### Core product principles

1. Accuracy before convenience.
2. Fast, frictionless expense entry.
3. Transparent and explainable calculations.
4. Privacy and security by default.
5. Free access to essential expense management.
6. Consistent functionality across web and mobile.
7. AI assistance without allowing AI to invent or independently finalize financial records.
8. Modular architecture that supports future growth.

---

## 3. Competitive Product Research

Before implementation, research the current capabilities, pricing, strengths, limitations, and user complaints associated with:

- Splitwise
- Tricount
- Settle Up
- Splid

Use official product pages, documentation, app listings, and credible user reviews. Use Reddit discussions where useful for understanding real user frustrations.

Create a competitive feature matrix covering:

- Expense creation and editing.
- Split methods.
- Group management.
- Debt simplification.
- Settlement workflows.
- Receipt scanning.
- Item-level bill splitting.
- Multi-currency expenses.
- Offline functionality.
- Recurring expenses.
- Notifications and reminders.
- Budgeting and analytics.
- Payment integrations.
- Data export and import.
- Pricing and paywalls.
- Privacy and security.

Identify the strongest features from each application and explain which should be adopted, adapted, or excluded.

Do not copy proprietary source code, branding, assets, or protected designs. Build an original product using established product patterns.

Deliver the research findings before making major architectural decisions.

---

## 4. Required Feature Set

### A. Expense Management

Implement:

- Create, view, edit, archive, and reverse expenses.
- Equal splits.
- Exact-amount splits.
- Percentage-based splits.
- Share-based splits.
- Weighted splits.
- Unequal contributions.
- Multiple payers for a single expense.
- Custom participant selection.
- Expense categories.
- Dates, descriptions, notes, and locations.
- Receipt attachments.
- Tax, tips, service charges, and discounts.
- Refunds and partial repayments.
- Recurring expenses.
- Expense duplication.
- Expense search and filtering.
- Currency-aware expense records.
- Expense change history.

Validate every split before saving it.

The sum of allocated shares must equal the expense total exactly. Handle rounding deterministically and use integer minor currency units rather than floating-point arithmetic for financial calculations.

### B. Groups and Membership

Support groups for:

- Trips and vacations.
- Roommates and shared apartments.
- Couples and families.
- College students.
- Office teams.
- Events and celebrations.
- Custom user-defined purposes.

Implement:

- Group creation and editing.
- Invitations through secure links and QR codes.
- Membership management.
- Group owners, administrators, and members.
- Guest participation where appropriate.
- Group-specific currencies and settings.
- Group activity history.
- Configurable permissions.
- Archived groups.
- Group templates.
- Separate personal and shared expense views.

Enforce membership and authorization checks on the server for every sensitive operation.

### C. Balances and Settlement Engine

Implement a reliable financial calculation engine that:

1. Calculates each participant's share.
2. Accounts for payments made by each participant.
3. Computes net balances.
4. Identifies creditors and debtors.
5. Suggests a reduced set of repayment transfers.
6. Supports partial and complete settlements.
7. Updates outstanding balances consistently.
8. Preserves the history of every expense and settlement.
9. Handles expense reversals and corrections.
10. Provides an explanation of how each balance was calculated.

Use a greedy creditor-debtor matching algorithm initially, with a clear interface for replacing it with an optimization algorithm if required.

Do not assume a greedy algorithm always achieves the globally minimum number of transfers.

Never treat a cached or displayed balance as the authoritative financial record. Calculate balances from the underlying expense allocations, payments, reversals, and settlement records.

Use database transactions, idempotency keys, and concurrency controls to prevent duplicate payments and inconsistent financial records.

### D. AI-Powered Expense Entry

Build AI-assisted features for:

**Receipt scanning**
- Extract the merchant, date, currency, line items, taxes, discounts, and total.
- Allow users to assign individual items to specific participants.
- Allocate shared dishes and common charges.
- Verify that the receipt totals reconcile.
- Display confidence indicators and request corrections where needed.

**Voice-to-expense**
- Convert natural-language descriptions into structured expense drafts.
- Extract the amount, payer, participants, category, date, and description where available.
- Ask for clarification when essential details are missing.

**Text-to-expense**
- Allow natural-language entry such as: "I paid ₹900 for dinner for Rahul, Priya, and me."
- Generate a structured draft for review.
- Resolve participant names only against authorized group members.

**Smart assistance**
- Suggest expense categories.
- Detect potential duplicate expenses.
- Identify unusual or inconsistent amounts.
- Explain group spending trends.
- Answer questions using authorized expense records.

Use OCR and structured extraction before introducing more expensive AI models. Benchmark accuracy and operating costs.

AI must never silently finalize an uncertain financial transaction or invent missing information.

### E. Recurring Expenses and Household Management

Implement:

- Monthly rent.
- Electricity and water bills.
- Internet subscriptions.
- Grocery expenses.
- Household maintenance.
- Shared digital subscriptions.
- Custom recurring schedules.
- Due dates and reminders.
- Unequal rent allocation based on room size or agreed weights.
- Draft generation for recurring expenses.
- Confirmation before a generated expense is finalized.

Allow users to pause, modify, or cancel recurring schedules.

### F. Travel Mode

Implement:

- Trip creation and member invitations.
- Trip-specific expenses.
- Multiple currencies.
- Explicit exchange rates and conversion timestamps.
- Trip budgets.
- Spending by category and day.
- Receipt storage.
- Offline expense creation.
- Synchronization after reconnection.
- Final trip expense reports.
- Simplified post-trip settlement.

Preserve the original currency and original amount of each expense. Never silently overwrite historical exchange rates.

### G. Settlement and Payment Recording

Support recording repayments through:

- Cash.
- Bank transfer.
- UPI.
- Other external payment methods.

Implement:

- Settlement requests.
- Payment instructions and shareable links.
- QR-based payment handoffs where appropriate.
- Partial repayments.
- Settlement confirmations.
- Configurable payment reminders.
- Settlement history.
- Outstanding balance updates.

For India, evaluate suitable UPI payment handoffs and provider integrations.

Opening a payment application does not establish that a payment succeeded. Update settlement status only after verified provider confirmation or an explicit user confirmation for external payments.

Do not implement a wallet, hold customer funds, or represent an external payment as verified without appropriate evidence. Investigate applicable regulatory and provider requirements before implementing direct payment processing.

### H. Notifications

Support:

- Expense additions and edits.
- Group invitations.
- Settlement requests.
- Payment confirmations.
- Recurring expense reminders.
- Budget alerts.
- Optional overdue balance reminders.

Implement configurable notification preferences, quiet hours, rate limits, and duplicate suppression.

Support web notifications where appropriate and push notifications on Android and iOS.

### I. Analytics and Reports

Implement:

- Personal spending summaries.
- Group spending summaries.
- Monthly and annual trends.
- Category-wise expenses.
- Trip budget versus actual spending.
- Outstanding debts.
- Upcoming recurring bills.
- Searchable expense history.
- CSV and Excel exports.
- PDF reports.
- Date-range filtering.

All reports must use consistent financial calculations and respect the viewer's permissions.

### J. Offline Functionality

Support offline expense creation and editing where practical.

Implement:

- Local persistence.
- A pending synchronization queue.
- Clear sync status indicators.
- Retry mechanisms.
- Idempotent API requests.
- Conflict detection and resolution.
- Protection against duplicate expenses.
- Recovery from interrupted synchronization.

Do not implement naive last-write-wins synchronization for financial records. Use explicit conflict-resolution rules and preserve audit history.

### K. Import and Migration

Evaluate supported imports from existing expense-sharing applications.

Where data is available through user-authorized exports:

- Import people and groups.
- Import expenses and participant allocations.
- Preserve original dates, currencies, and descriptions.
- Validate imported balances.
- Detect malformed or duplicate records.
- Generate an import summary.
- Allow users to review results before finalizing the import.

Never claim compatibility with an export format that has not been tested.

---

## 5. Technology Stack

Use a TypeScript-first architecture.

### Web frontend
- Next.js.
- React.
- TypeScript.
- Tailwind CSS.
- Accessible component library.

### Mobile applications
- React Native.
- Expo.
- TypeScript.
- Native navigation and platform integrations.
- Secure device storage.
- Android and iOS push notification support.

### Backend
- NestJS with TypeScript.
- REST API with versioning.
- OpenAPI documentation.
- Modular domain-oriented architecture.
- Background workers for scheduled tasks.

A modular Next.js backend may be used for an initial MVP if it materially reduces complexity, but keep financial business logic independent of the web UI.

### Database
- PostgreSQL.
- Prisma ORM.
- Version-controlled database migrations.
- Appropriate foreign keys, indexes, unique constraints, and transactions.

### Infrastructure
- Redis and BullMQ for background jobs where needed.
- S3-compatible object storage for receipts and exports.
- Firebase Cloud Messaging and Apple Push Notification service for mobile push delivery.
- Sentry or an equivalent error-monitoring solution.
- CI/CD pipelines.
- Automated backups and recovery procedures.

### Shared monorepo structure

Use a structure similar to:

splitmate/
- apps/web
- apps/mobile
- apps/api
- apps/admin
- packages/expense-engine
- packages/validation
- packages/types
- packages/design-tokens
- prisma
- docs

The exact structure can be adjusted after architectural analysis.

Share business logic, validation schemas, and types where appropriate. Do not force web-specific UI components into React Native.

---

## 6. Database Design

Design and document a normalized PostgreSQL schema containing at least:

- User
- Device
- Group
- GroupMember
- Expense
- ExpenseParticipant
- ExpenseItem
- ExpenseItemAssignment
- Settlement
- SettlementAllocation
- RecurringExpense
- Receipt
- Attachment
- Notification
- ReminderPreference
- AuditEvent
- ImportJob

Add other entities when justified.

Requirements:

- Use stable identifiers.
- Store currency codes explicitly.
- Store amounts using integer minor units or an equivalently exact monetary representation.
- Preserve historical currency and exchange-rate information.
- Define ownership and membership relationships.
- Enforce appropriate uniqueness and referential integrity.
- Add indexes for frequent balance, expense-history, and group-membership queries.
- Keep settlement records separate from expense records.
- Record changes and reversals through an auditable mechanism.
- Prevent unauthorized cross-group access.
- Document deletion, retention, and account-export behavior.

Produce an ER diagram and explain the important relationships before implementing the full schema.

---

## 7. UI/UX Requirements

Create an original, polished, modern fintech-style interface.

The design should be:

- Minimal.
- Mobile-first.
- Responsive.
- Accessible.
- Fast to navigate.
- Easy for nontechnical users.
- Consistent across web, Android, and iOS.

Avoid cluttered dashboards and unnecessary financial jargon.

### Main navigation

Use five primary destinations:

1. Home.
2. Groups.
3. Add Expense.
4. Insights.
5. Profile.

Make Add Expense the most prominent action.

### Dashboard

Display:

- Total amount owed to the user.
- Total amount the user owes.
- Active groups.
- Recent expenses.
- Suggested settlements.
- Upcoming recurring bills.
- Relevant notifications.

Clearly distinguish amounts owed to the user from amounts the user owes.

### Required screens

Build:

- Onboarding.
- Registration and login.
- Dashboard.
- Group list.
- Group details.
- Add and edit expense.
- Itemized receipt splitting.
- Balance details.
- Settlement workflow.
- Recurring expenses.
- Spending analytics.
- Notifications.
- Profile and settings.
- Data export.
- Account deletion.
- Administrative operations.

Include loading states, empty states, validation errors, offline states, and recovery flows.

Use realistic sample data only in development. Never display fabricated transactions as actual user financial records.

---

## 8. Security and Privacy

Treat the application as a sensitive financial-data product.

Implement:

- Strong authentication.
- Server-side authorization.
- Group-scoped access controls.
- Secure session management.
- Rate limiting.
- Input validation.
- Protection against injection and broken access control.
- Private object storage.
- Expiring signed URLs.
- Secure secret management.
- Audit logging.
- Appropriate encryption at rest and in transit.
- Account deletion and data-export workflows.
- Minimal collection of personal information.
- Dependency and vulnerability scanning.
- Automated security tests.

Never place privileged server credentials in web or mobile client code.

Never rely solely on client-side authorization checks.

Avoid logging passwords, access tokens, private receipt URLs, or unnecessary personal financial information.

Document the threat model and test cross-user and cross-group authorization explicitly.

---

## 9. Monetization

Design a freemium business model.

### Free
- Core expense recording.
- Groups and invitations.
- Flexible splitting.
- Balances and settlements.
- Essential reminders.
- Basic expense history.

### Plus
- Advanced analytics.
- Enhanced receipt scanning.
- Custom templates.
- Advanced reports and exports.

### Group Pro
- Shared budgets.
- Recurring expense automation.
- Advanced group analytics.
- Additional household and travel tools.

### Business
- Team expense policies.
- Administrative controls.
- Approval workflows.
- Advanced reporting and audit exports.

Treat the following as initial pricing hypotheses for validation:

- Plus: ₹99/month or ₹799/year.
- Group Pro: ₹199/group/month.
- Business: custom pricing.

Keep essential expense management free. Validate willingness to pay before committing to a monetization strategy.

---

## 10. Testing and Quality Assurance

Create a comprehensive test strategy.

### Unit tests
Test the expense engine for:

- Equal splits.
- Unequal splits.
- Exact allocations.
- Percentage splits.
- Weighted splits.
- Multiple payers.
- Partial settlements.
- Refunds.
- Reversals.
- Rounding.
- Multi-currency calculations.
- Settlement optimization.

### Integration tests
Test:

- Database transactions.
- Expense creation and updates.
- Concurrent modifications.
- Settlement processing.
- Recurring jobs.
- Notification delivery.
- Import workflows.
- Authentication and authorization.

### End-to-end tests
Test complete user journeys:

1. Register and create a group.
2. Invite three members.
3. Add expenses paid by different people.
4. Verify all balances.
5. Complete partial settlements.
6. Confirm remaining balances.
7. Edit or reverse an expense.
8. Verify the audit history.
9. Test offline synchronization.
10. Verify that unauthorized users cannot access group data.

### Quality gates

Require:

- Automated tests in CI.
- Type checking.
- Linting.
- Migration validation.
- Security checks.
- Production build verification.
- Critical financial calculation tests.

Do not deploy to production when critical financial tests fail.

---

## 11. Development Roadmap

### Phase 1: Discovery and architecture
- Research competitors.
- Define product requirements.
- Document user journeys.
- Produce the architecture diagram.
- Design the database.
- Establish the security model.
- Create the implementation plan.

### Phase 2: Core MVP
- Authentication.
- Groups and membership.
- Expense entry.
- Flexible splits.
- Balance calculation.
- Settlement recording.
- Notifications.
- Basic responsive web interface.

### Phase 3: Mobile applications
- React Native and Expo setup.
- Android and iOS navigation.
- Authentication integration.
- Shared expense functionality.
- Push notifications.
- Secure local storage.
- Initial offline support.

### Phase 4: Advanced capabilities
- Receipt OCR.
- Item-level splitting.
- Recurring expenses.
- Multi-currency support.
- Spending insights.
- Export and import.
- UPI handoffs.

### Phase 5: Reliability and launch
- Security review.
- Performance testing.
- Backup and recovery tests.
- Production monitoring.
- App Store and Google Play preparation.
- Privacy disclosures.
- Beta testing.
- Release and rollback procedures.

Treat the roadmap as a sequence of independently verifiable milestones, not a reason to rush implementation.

---

## 12. Deployment and DevOps

Set up:

- Separate development, staging, and production environments.
- Environment-specific configuration.
- Secure secrets.
- Automated CI/CD.
- Database migration checks.
- Automated tests before deployment.
- Backups and recovery procedures.
- Health checks and structured logs.
- Error monitoring.
- Rollback procedures.
- Mobile beta distribution.

Never apply untested database migrations directly to production.

Do not expose internal administration endpoints publicly without appropriate authorization.

Keep production credentials and real user data out of local development and testing.

---

## 13. How You Must Execute This Project

Follow this process strictly.

### Step 1: Inspect before building

If a repository already exists, inspect its structure, package files, dependencies, environment configuration, database schema, existing components, and deployment setup.

Do not overwrite or replace existing working code without understanding its purpose.

If this is a new project, create the repository structure and foundational documentation first.

### Step 2: Produce the implementation plan

Before making major code changes, deliver:

- Competitive analysis.
- Product requirements document.
- Architecture diagram.
- Database ER diagram.
- API endpoint plan.
- Security model.
- UI screen inventory.
- Testing strategy.
- Deployment strategy.
- Prioritized implementation backlog.

Identify assumptions and unresolved decisions explicitly.

### Step 3: Establish the foundation

Set up the monorepo, TypeScript configuration, linting, formatting, testing, database connectivity, migrations, environment configuration, and CI pipeline.

Verify that the project builds successfully.

### Step 4: Build the expense engine first

Implement the split calculation and settlement logic independently.

Write tests for edge cases and monetary precision.

Do not build elaborate UI features on top of unverified financial calculations.

### Step 5: Implement vertical slices

Complete one end-to-end feature at a time.

For example:

- Database schema.
- API endpoint.
- Validation.
- Authorization.
- Business logic.
- Frontend screen.
- Automated tests.
- Documentation.

Verify each slice before moving to the next.

### Step 6: Build the web and mobile clients

Use shared business logic and types where appropriate.

Keep platform-specific UI, navigation, permissions, and storage implementations separate where necessary.

### Step 7: Validate before release

Run all critical tests, inspect security boundaries, verify database migrations, and test production-like deployment.

### Step 8: Document all changes

Maintain:

- README.
- Architecture documentation.
- Database schema documentation.
- API documentation.
- Environment variable examples.
- Local setup instructions.
- Test commands.
- Deployment commands.
- Troubleshooting instructions.
- Known limitations.

Never claim that a feature, test, deployment, or integration is complete unless it has actually been implemented and verified.

---

## 14. Expected Deliverables

Produce:

1. Competitive analysis and feature comparison.
2. Product requirements document.
3. Architecture and infrastructure design.
4. Database schema and ER diagram.
5. API specifications.
6. UI/UX design system and screen implementations.
7. Working responsive web application.
8. Working Android application.
9. Working iOS application.
10. Tested expense calculation engine.
11. Authentication and authorization.
12. Receipt-processing and AI-assisted entry modules.
13. Settlement and notification workflows.
14. Automated test suite.
15. CI/CD configuration.
16. Deployment and release documentation.
17. Security and privacy documentation.
18. Prioritized future roadmap.

The final product should be functional, tested, maintainable, and ready for controlled beta testing. Do not describe an unimplemented prototype as a production-ready system.

---

## 15. Final Instruction

Think like a product founder and a senior engineer.

Build the smallest dependable product that solves the core problem exceptionally well, then expand based on evidence.

Prioritize accurate balances, fast expense entry, transparent settlement, strong authorization, and a polished user experience.

Do not add complexity just to increase the feature count. Every feature must solve a real user problem.

**Begin with Step 1: inspect the existing project or confirm that this is a new repository. Then present the competitive analysis, architecture proposal, and prioritized implementation plan before starting major development.**