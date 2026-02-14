# Renewal Alerts SOP

## Goal
Automatically create support renewal reminders 12 months after a "Support Fee" transaction is recorded.

## How It Works

### Database Trigger: `create_support_renewal()`

When a transaction is inserted with `category_id` matching "Support Fee", this trigger creates a renewal record.

**Logic:**

1. Get the "Support Fee" category ID
2. If the new transaction matches that category:
   - Create a row in `renewals` table
   - Set `renewal_date = transaction.date + 12 months`
   - Link to the transaction and client (if provided)

### Example Flow

**User adds a Support Fee transaction:**
```sql
INSERT INTO transactions (
  type, category_id, amount, client_id, account_id, date
) VALUES (
  'revenue', '<support_fee_category>', 5000.00, '<client_xyz>', '<cash>', '2026-02-12'
);
```

**Trigger automatically creates:**
```sql
INSERT INTO renewals (
  transaction_id, client_id, renewal_date, status
) VALUES (
  '<new_transaction_id>', '<client_xyz>', '2027-02-12', 'pending'
);
```

## Dashboard Integration

The dashboard API counts renewals with:
- `status = 'pending'`
- `renewal_date <= today + 30 days`

This count is shown in an amber alert banner when > 0.

## Future Enhancement Ideas

1. **Email Notifications** — Send an email when `renewal_date` is 7 days away
2. **Renewal Status Updates** — Allow users to mark renewals as "renewed" or "expired"
3. **Recurring Renewals** — If user marks as "renewed", create ANOTHER renewal 12 months from the new date

## Edge Cases

1. **Deleting the original transaction** — If the source transaction is deleted, the renewal is CASCADE deleted (foreign key constraint).
2. **Updating the transaction date** — Renewal date does NOT auto-update. It's based on the original insert date.
3. **Non-revenue Support Fees** — The trigger only fires for `INSERT`, so if someone changes an existing transaction's category to "Support Fee", no renewal is created (intentional).

## Maintenance

- Never manually insert into `renewals` — Always use the transaction insert flow.
- If a renewal is missing, check if the transaction's category is exactly "Support Fee"
