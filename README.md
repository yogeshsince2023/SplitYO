# SplitMate — AI-Powered Shared Expense Management Platform

> **100% Free Forever Alternative to Splitwise, Tricount, and Settle Up.**  
> Zero subscriptions, zero paywalls, zero ads, zero artificial limits.

Built from scratch based on the master project specifications in `app.md`.

---

## 🌟 Core Differentiators & Features

1. **Deterministic Monetary Engine (Zero Floating-Point Drift)**
   - Financial calculations executed in integer minor units (paise / cents).
   - Equal splits, exact splits, percentage splits (100% validated), weighted share splits.
   - Itemized receipt splitting with proportional tax/tip distribution.
   - Deterministic remainder distribution to avoid fractional currency discrepancies.

2. **Smart Debt Simplification (Min-Transfers Greedy Algorithm)**
   - Calculates true net balances per member.
   - Minimizes the number of settlement transactions across the group.
   - Replaces convoluted multi-party IOUs with clean direct repayments.

3. **Instant UPI Settlement & QR Handoffs**
   - Direct `upi://pay?pa=...` deep-links for Google Pay, PhonePe, Paytm.
   - Live visual QR codes with payee name, amount, and reference notes.
   - Instant confirmation and audit trail updates.

4. **AI-Assisted Natural Language & Receipt OCR Entry**
   - **Text-to-Expense & Voice Entry**: Type or speak "Dinner ₹1200 paid by Priya for everyone" to auto-populate the structured form.
   - **Receipt OCR**: Instant line item extraction, tax calculation, and person-by-person item assignment.

5. **100% Free Forever (No Gated Features)**
   - **Unlimited Expenses**: No 3-expense/day limits.
   - **Free Receipt Scanning**: No Pro paywall.
   - **Free Multi-Currency**: INR, USD, EUR, GBP, CAD, AUD, JPY support.
   - **Free Offline Mode**: LocalStorage persistence with queued synchronization.
   - **Free Export**: Download complete group records as CSV or full JSON backups.

---

## 📂 Project Structure

```text
splitmate/
├── src/
│   ├── types/
│   │   └── index.ts                 # Clean TypeScript models (User, Group, Expense, Settlement)
│   ├── engine/
│   │   ├── expenseEngine.ts         # Integer monetary logic & debt simplification
│   │   ├── expenseEngine.test.ts    # Comprehensive unit tests
│   │   ├── aiParser.ts              # Natural Language parser & receipt OCR simulator
│   │   ├── upiGenerator.ts          # UPI deep-links & QR code generator
│   │   └── offlineStore.ts          # LocalStorage persistence & sync queue
│   ├── styles/
│   │   └── designSystem.css         # Glassmorphism tokens, dark/light theme, typography
│   ├── components/
│   │   ├── Header.tsx               # Brand, persona switcher, sync badge, theme toggle
│   │   ├── Navigation.tsx           # 5-tab responsive navigation bar + FAB Add button
│   │   ├── DashboardTab.tsx         # Net balances, simplified debt cards, active groups
│   │   ├── GroupsTab.tsx            # Category filters, group cards, create group modal
│   │   ├── GroupDetailModal.tsx     # Expenses, debts, recurring bills, invite share
│   │   ├── AddExpenseModal.tsx      # Equal, Exact, %, Shares, Itemized OCR, AI voice
│   │   ├── SettleModal.tsx          # Direct UPI settlement modal with QR codes
│   │   ├── InsightsTab.tsx          # Category breakdown progress bars, JSON export
│   │   ├── ActivityTab.tsx          # Chronological audit trail & confirmed settlements
│   │   └── ProfileTab.tsx           # 100% Free Forever manifesto, UPI VPA config, backup
│   ├── App.tsx                      # Root orchestration & state synchronization
│   ├── main.tsx                     # React entrypoint
│   └── index.css                    # Global utility imports
├── dist/                            # Production build artifacts
├── package.json
└── vite.config.ts
```

---

## 🚀 Running Locally

```bash
cd C:\Users\yoges\.gemini\antigravity-ide\scratch\splitmate
npm install
npm run dev
```

App runs on `http://localhost:5173`.
