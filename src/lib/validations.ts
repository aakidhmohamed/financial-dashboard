import { z } from 'zod'

// ─── Transaction Validation ────────────────────────────────────────
export const transactionSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    type: z.enum(['revenue', 'expense', 'capital', 'transfer', 'loan']),
    category_id: z.string().uuid('Invalid category ID'),
    amount: z.number().positive('Amount must be greater than 0'),
    description: z.string().nullish(),
    client_id: z.string().uuid().nullish(),
    supplier_id: z.string().uuid().nullish(),
    account_id: z.string().uuid('Invalid account ID'),
    to_account_id: z.string().uuid().nullish(),
}).refine(data => {
    if ((data.type === 'transfer' || data.type === 'loan') && !data.to_account_id) {
        return false
    }
    return true
}, {
    message: 'transfer and loan types require to_account_id',
    path: ['to_account_id'],
}).refine(data => {
    if ((data.type === 'transfer' || data.type === 'loan') && data.account_id === data.to_account_id) {
        return false
    }
    return true
}, {
    message: 'Source and destination accounts must be different',
    path: ['to_account_id'],
})

export type TransactionPayload = z.infer<typeof transactionSchema>

// ─── Client Validation ─────────────────────────────────────────────
export const clientSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email().nullish().or(z.literal('')),
    phone: z.string().max(50).nullish().or(z.literal('')),
    address: z.string().max(500).nullish().or(z.literal('')),
    notes: z.string().max(1000).nullish().or(z.literal('')),
})

export type ClientPayload = z.infer<typeof clientSchema>

// ─── Supplier Validation ───────────────────────────────────────────
export const supplierSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    email: z.string().email().nullish().or(z.literal('')),
    phone: z.string().max(50).nullish().or(z.literal('')),
    notes: z.string().max(1000).nullish().or(z.literal('')),
})

export type SupplierPayload = z.infer<typeof supplierSchema>

// ─── Invoice Item ──────────────────────────────────────────────────
export const invoiceItemSchema = z.object({
    description: z.string().min(1, 'Item description is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unit_price: z.number().min(0, 'Unit price cannot be negative'),
})

// ─── Invoice Validation ────────────────────────────────────────────
export const invoiceSchema = z.object({
    document_type: z.enum(['quotation', 'invoice']),
    document_number: z.string().min(1, 'Document number is required'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
    client_id: z.string().uuid().nullish(),
    discount: z.number().min(0).default(0),
    tax_rate: z.number().min(0).max(100).default(0),
    shipping: z.number().min(0).default(0),
    advance_paid: z.number().min(0).default(0),
    remarks: z.string().nullish(),
    status: z.enum(['draft', 'sent', 'accepted', 'expired', 'paid']).default('draft'),
    quotation_id: z.string().uuid().nullish(),
    items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
})

export type InvoicePayload = z.infer<typeof invoiceSchema>

// ─── Invoice Update Validation ─────────────────────────────────────
export const invoiceUpdateSchema = z.object({
    document_type: z.enum(['quotation', 'invoice']).optional(),
    document_number: z.string().min(1).optional(),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    client_id: z.string().uuid().nullish(),
    discount: z.number().min(0).optional(),
    tax_rate: z.number().min(0).max(100).optional(),
    shipping: z.number().min(0).optional(),
    advance_paid: z.number().min(0).optional(),
    remarks: z.string().nullish(),
    status: z.enum(['draft', 'sent', 'accepted', 'expired', 'paid']).optional(),
    items: z.array(invoiceItemSchema).min(1).optional(),
    payment_account_id: z.string().uuid().nullish(),
})

export type InvoiceUpdatePayload = z.infer<typeof invoiceUpdateSchema>
