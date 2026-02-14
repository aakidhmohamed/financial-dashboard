# 📜 gemini.md — Project Constitution

> This is **law**. All data schemas, behavioral rules, and architectural invariants live here.
> Only updated when a schema changes, a rule is added, or architecture is modified.

---

## North Star

**Real-Time Net Worth & Liquidity Dashboard** — Track net profit, debts vs. credits, and actual cash available at any moment. Built for a business doing POS Sales, Graphic Design, and POS Support.

---

## Data Schema

### Supabase Tables

#### `clients`
```json
{
  "id": "uuid (PK, auto-generated)",
  "name": "text (NOT NULL)",
  "email": "text (nullable)",
  "phone": "text (nullable)",
  "notes": "text (nullable)",
  "created_at": "timestamptz (default now())",
  "updated_at": "timestamptz (default now())"
}
```

#### `suppliers`
```json
{
  "id": "uuid (PK, auto-generated)",
  "name": "text (NOT NULL)",
  "email": "text (nullable)",
  "phone": "text (nullable)",
  "notes": "text (nullable)",
  "created_at": "timestamptz (default now())",
  "updated_at": "timestamptz (default now())"
}
```

#### `accounts`
> Balance sheet accounts. Type = 'asset' or 'liability'.
```json
{
  "id": "uuid (PK, auto-generated)",
  "name": "text (NOT NULL, UNIQUE)",
  "type": "text CHECK (type IN ('asset', 'liability'))",
  "balance": "numeric(12,2) (default 0.00)",
  "description": "text (nullable)",
  "created_at": "timestamptz (default now())",
  "updated_at": "timestamptz (default now())"
}
```
Default accounts seeded on init:
- **Cash** (asset)
- **Stock/Inventory** (asset)
- **Accounts Receivable** (asset)
- **Accounts Payable** (liability)
- **Debts** (liability)

#### `categories`
```json
{
  "id": "uuid (PK, auto-generated)",
  "name": "text (NOT NULL, UNIQUE)",
  "type": "text CHECK (type IN ('revenue', 'expense'))",
  "created_at": "timestamptz (default now())"
}
```
Seeded categories:
- Revenue: **POS Sale**, **Support Fee**, **Graphic Design**
- Expense: **Supplies**, **Rent**, **Utilities**, **Salaries**, **Other**

#### `transactions`
> Every financial entry. Each transaction updates an account balance.
```json
{
  "id": "uuid (PK, auto-generated)",
  "date": "date (NOT NULL, default CURRENT_DATE)",
  "type": "text CHECK (type IN ('revenue', 'expense'))",
  "category_id": "uuid (FK -> categories.id, NOT NULL)",
  "amount": "numeric(12,2) (NOT NULL, CHECK > 0)",
  "description": "text (nullable)",
  "client_id": "uuid (FK -> clients.id, nullable)",
  "supplier_id": "uuid (FK -> suppliers.id, nullable)",
  "account_id": "uuid (FK -> accounts.id, NOT NULL)",
  "created_at": "timestamptz (default now())",
  "updated_at": "timestamptz (default now())"
}
```

#### `renewals`
> Auto-generated when a "Support Fee" transaction is created. Flags renewal 12 months later.
```json
{
  "id": "uuid (PK, auto-generated)",
  "transaction_id": "uuid (FK -> transactions.id, NOT NULL)",
  "client_id": "uuid (FK -> clients.id, nullable)",
  "renewal_date": "date (NOT NULL, = transaction.date + 12 months)",
  "status": "text CHECK (status IN ('pending', 'renewed', 'expired')) default 'pending'",
  "notified_at": "timestamptz (nullable)",
  "created_at": "timestamptz (default now())"
}
```

### API Payload Shapes

#### Dashboard Summary (GET `/api/dashboard`)
```json
{
  "netWorth": 12500.00,
  "totalAssets": 25000.00,
  "totalLiabilities": 12500.00,
  "cashBalance": 8500.00,
  "revenueThisMonth": 4200.00,
  "expensesThisMonth": 1800.00,
  "netProfitThisMonth": 2400.00,
  "upcomingRenewals": 3,
  "accountBalances": [
    { "name": "Cash", "type": "asset", "balance": 8500.00 },
    { "name": "Debts", "type": "liability", "balance": 5000.00 }
  ],
  "recentTransactions": [ "..." ]
}
```

#### Transaction Input (POST `/api/transactions`)
```json
{
  "date": "2026-02-12",
  "type": "revenue",
  "category_id": "uuid",
  "amount": 150.00,
  "description": "Logo design for Client X",
  "client_id": "uuid | null",
  "supplier_id": "uuid | null",
  "account_id": "uuid"
}
```

---

## Behavioral Rules

1. **Revenue Categorization** — All revenue MUST be categorized as one of: `POS Sale`, `Support Fee`, or `Graphic Design`.
2. **Balance Sheet Integrity** — Every transaction MUST update the `balance` field of its associated `accounts` row. Revenue → increases asset balance. Expense → decreases asset balance (or increases liability).
3. **Support Renewal Auto-Flag** — When a `Support Fee` transaction is created, a row MUST be inserted into `renewals` with `renewal_date = transaction.date + 12 months`.
4. **No Negative Cash** — The system SHOULD warn (not block) when a transaction would bring Cash balance below zero.
5. **Amounts Are Always Positive** — The `type` field (revenue/expense) determines direction. `amount` is always > 0.

---

## Architectural Invariants

1. **3-Layer A.N.T. Architecture**
   - `architecture/` → SOPs (Layer 1)
   - Navigation → Decision routing (Layer 2)
   - `tools/` → Deterministic scripts (Layer 3)

2. **Data-First Rule** — No coding until payload shapes are confirmed.

3. **Self-Annealing** — Analyze → Patch → Test → Update Architecture on every failure.

4. **Intermediates in `.tmp/`** — All temp files are ephemeral.

5. **Payload = Cloud** — Project is only "complete" when the dashboard is deployed and connected to live Supabase.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind CSS |
| Backend | Next.js API Routes (Route Handlers) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (optional future) |
| ORM | Supabase JS Client (`@supabase/supabase-js` + `@supabase/ssr`) |
| Deployment | Vercel |

---

## Maintenance Log

_Will be populated in Phase 5 (Trigger)._
