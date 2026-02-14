# Balance Sheet SOP

## Goal
Automatically maintain accurate account balances as transactions are added, updated, or deleted.

## How It Works

### Database Trigger: `update_account_balance()`

Every time a transaction is inserted, updated, or deleted, this trigger recalculates the affected account's balance.

**Logic:**

1. **Revenue transactions** — ADD to account balance
2. **Expense transactions** — SUBTRACT from account balance

### Example Flow

**INSERT a revenue transaction:**
```sql
INSERT INTO transactions (
  type, category_id, amount, account_id, date
) VALUES (
  'revenue', '<pos_sale_category>', 1500.00, '<cash_account>', '2026-02-12'
);
```

**Result:** `Cash` account balance increases by 1500.00

**UPDATE a transaction amount:**
```sql
UPDATE transactions 
SET amount = 2000.00 
WHERE id = '<transaction_id>';
```

**Trigger actions:**
1. Reverse old amount (subtract 1500.00)
2. Apply new amount (add 2000.00)  
**Result:** Net change = +500.00

**DELETE a transaction:**
```sql
DELETE FROM transactions WHERE id = '<transaction_id>';
```

**Trigger actions:**  
Reverse the transaction (opposite of original operation)  
**Result:** Balance returns to pre-transaction state

## Edge Cases

1. **Negative Cash Warning** — The system does NOT block negative cash. It's possible for `Cash` to go negative if expenses exceed revenue. This is intentional (allows tracking overdrafts).

2. **Account Type Doesn't Matter** — The trigger doesn't enforce which account type you use. You can post revenue to a Liability account (though this is bad accounting). The UI should guide users to the correct accounts.

## Maintenance

- **Never manually update `accounts.balance`** — Always let the trigger handle it.
- **To fix incorrect balances** — Delete and re-add the transaction, or trace which transaction caused the error.
