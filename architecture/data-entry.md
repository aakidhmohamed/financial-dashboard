# Data Entry SOP

## Transaction Entry Rules

### Required Fields
1. **Date** — Default: Today, but user can change
2. **Type** — Revenue or Expense (radio buttons)
3. **Category** — Must select from filtered list (based on type)
4. **Amount** — Must be > 0 (validated by Zod and database CHECK constraint)
5. **Account** — Which balance sheet account is affected

### Optional Fields
- **Client** — Only visible for Revenue transactions
- **Supplier** — Only visible for Expense transactions  
- **Description** — Free text notes

### Validation Rules

**Form Validation (Zod):**
```typescript
amount: z.number().positive('Amount must be greater than 0')
category_id: z.string().uuid('Please select a category')
account_id: z.string().uuid('Please select an account')
```

**Database Constraints:**
```sql
CHECK (amount > 0)
```

**Category Filtering:**
- When `type = 'revenue'` → Only show revenue categories
- When `type = 'expense'` → Only show expense categories

## Account Selection Guide

| Transaction Type | Recommended Account |
|---|---|
| Cash sale (POS, Design) | Cash |
| Credit sale | Accounts Receivable |
| Inventory purchase | Stock/Inventory |
| Service expense (Rent, Utilities) | Cash |
| Credit purchase | Accounts Payable |
| Loan payment | Debts |

## Category Descriptions

### Revenue
- **POS Sale** — Point-of-sale transactions
- **Support Fee** — Annual POS support contracts (auto-creates renewal)
- **Graphic Design** — Design services

### Expense
- **Supplies** — Office supplies, materials
- **Rent** — Monthly office/shop rent
- **Utilities** — Electricity, water, internet
- **Salaries** — Employee wages
- **Other** — Miscellaneous expenses

## Best Practices

1. **Always fill Description** — Even though optional, future-you will thank you
2. **Link to Clients/Suppliers** — Helps with reporting and relationship tracking
3. **Use correct account** — Cash for immediate transactions, Receivable/Payable for credit
4. **Date accuracy** — Backdate transactions to the actual date they occurred

## Common Mistakes

❌ Selecting a Revenue category for an Expense transaction (prevented by UI filtering)  
❌ Entering negative amounts (use Type to indicate direction)  
❌ Forgetting to link Support Fees to clients (renewal alerts work better with client linkage)
