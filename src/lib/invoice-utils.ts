/**
 * Shared invoice calculation utilities.
 * Single source of truth for invoice total calculations.
 */

/**
 * Calculate the total amount for an invoice.
 * Formula: (subtotal - discount) * (1 + taxRate / 100) + shipping
 *
 * Uses integer arithmetic (cents) internally to avoid floating-point issues.
 */
export function calcInvoiceTotal(
    subtotal: number,
    discount: number = 0,
    taxRate: number = 0,
    shipping: number = 0,
): number {
    const afterDiscount = subtotal - discount
    const withTax = afterDiscount * (1 + taxRate / 100)
    const total = withTax + shipping
    // Round to 2 decimal places to avoid floating-point accumulation
    return Math.round(total * 100) / 100
}

/**
 * Calculate the subtotal from an array of line items.
 */
export function calcSubtotal(
    items: Array<{ quantity: number; unit_price: number }>
): number {
    const raw = items.reduce(
        (sum, item) => sum + item.quantity * item.unit_price,
        0
    )
    return Math.round(raw * 100) / 100
}

/**
 * Calculate the balance due on an invoice.
 */
export function calcBalanceDue(
    subtotal: number,
    discount: number = 0,
    taxRate: number = 0,
    shipping: number = 0,
    advancePaid: number = 0,
): number {
    const total = calcInvoiceTotal(subtotal, discount, taxRate, shipping)
    return Math.round((total - advancePaid) * 100) / 100
}
