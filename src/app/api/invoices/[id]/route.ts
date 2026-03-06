import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invoiceUpdateSchema } from '@/lib/validations'
import { calcSubtotal, calcInvoiceTotal } from '@/lib/invoice-utils'

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

        const { data, error } = await supabase
            .from('invoices')
            .select(`*, client:clients(*), items:invoice_items(*)`)
            .eq('id', id)
            .single()

        if (error) throw error
        if (!data) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        // Sort items by sort_order
        if (data.items) {
            data.items.sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        }

        return NextResponse.json(data)
    } catch (error) {
        console.error('Invoice GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch invoice' },
            { status: 500 }
        )
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params
        const body = await request.json()

        // Server-side validation
        const parsed = invoiceUpdateSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const validData = parsed.data

        // Fetch current invoice data to detect changes
        const { data: oldInvoice, error: fetchError } = await supabase
            .from('invoices')
            .select('advance_paid, client_id, date, document_number, subtotal, discount, tax_rate, shipping, status, document_type')
            .eq('id', id)
            .single()

        if (fetchError) throw fetchError
        if (!oldInvoice) {
            return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
        }

        const { items, payment_account_id, ...invoiceFields } = validData

        // Build update payload with explicit field whitelisting
        const updatePayload: Record<string, unknown> = {}
        if (invoiceFields.document_type !== undefined) updatePayload.document_type = invoiceFields.document_type
        if (invoiceFields.document_number !== undefined) updatePayload.document_number = invoiceFields.document_number
        if (invoiceFields.date !== undefined) updatePayload.date = invoiceFields.date
        if (invoiceFields.client_id !== undefined) updatePayload.client_id = invoiceFields.client_id || null
        if (invoiceFields.discount !== undefined) updatePayload.discount = invoiceFields.discount
        if (invoiceFields.tax_rate !== undefined) updatePayload.tax_rate = invoiceFields.tax_rate
        if (invoiceFields.shipping !== undefined) updatePayload.shipping = invoiceFields.shipping
        if (invoiceFields.advance_paid !== undefined) updatePayload.advance_paid = invoiceFields.advance_paid
        if (invoiceFields.remarks !== undefined) updatePayload.remarks = invoiceFields.remarks || null
        if (invoiceFields.status !== undefined) updatePayload.status = invoiceFields.status

        // Recalculate subtotal if items provided
        if (items) {
            updatePayload.subtotal = calcSubtotal(items)
        }

        updatePayload.updated_at = new Date().toISOString()

        const { error: updateError } = await supabase
            .from('invoices')
            .update(updatePayload)
            .eq('id', id)

        if (updateError) throw updateError

        // Replace items if provided
        if (items) {
            await supabase.from('invoice_items').delete().eq('invoice_id', id)

            const itemsWithInvoiceId = items.map((item, index) => ({
                invoice_id: id,
                description: item.description,
                quantity: item.quantity,
                unit_price: item.unit_price,
                total: Math.round(item.quantity * item.unit_price * 100) / 100,
                sort_order: index,
            }))

            const { error: itemsError } = await supabase
                .from('invoice_items')
                .insert(itemsWithInvoiceId)

            if (itemsError) throw itemsError
        }

        // Calculate old and new totals using shared utility
        const oldTotalAmount = calcInvoiceTotal(
            oldInvoice.subtotal || 0,
            oldInvoice.discount || 0,
            oldInvoice.tax_rate || 0,
            oldInvoice.shipping || 0
        )

        const newSubtotal = updatePayload.subtotal !== undefined
            ? updatePayload.subtotal as number
            : oldInvoice.subtotal || 0
        const newDiscount = updatePayload.discount !== undefined
            ? updatePayload.discount as number
            : oldInvoice.discount || 0
        const newTaxRate = updatePayload.tax_rate !== undefined
            ? updatePayload.tax_rate as number
            : oldInvoice.tax_rate || 0
        const newShipping = updatePayload.shipping !== undefined
            ? updatePayload.shipping as number
            : oldInvoice.shipping || 0
        const newTotalAmount = calcInvoiceTotal(newSubtotal, newDiscount, newTaxRate, newShipping)

        // AR logic — determine invoice status transitions
        const oldIsSent = (oldInvoice.status === 'sent' || oldInvoice.status === 'paid') && oldInvoice.document_type === 'invoice'
        const newStatus = invoiceFields.status || oldInvoice.status
        const newIsSent = (newStatus === 'sent' || newStatus === 'paid') && oldInvoice.document_type === 'invoice'

        // Find or create AR account (needed for AR logic)
        let arAccount: { id: string } | null = null
        if (oldIsSent || newIsSent) {
            const { data: existingAR } = await supabase
                .from('accounts')
                .select('id')
                .eq('name', 'Accounts Receivable')
                .eq('type', 'asset')
                .single()

            if (existingAR) {
                arAccount = existingAR
            } else {
                const { data: newAR, error: arError } = await supabase
                    .from('accounts')
                    .insert({ name: 'Accounts Receivable', type: 'asset' as const, balance: 0 })
                    .select('id')
                    .single()
                if (arError) throw arError
                arAccount = newAR
            }
        }

        // Handle Status Change: Draft -> Sent/Paid (Revenue Recognition)
        if (!oldIsSent && newIsSent && arAccount) {
            let { data: salesCategory } = await supabase
                .from('categories')
                .select('id')
                .eq('name', 'Sales')
                .eq('type', 'revenue')
                .single()

            if (!salesCategory) {
                const { data: newCategory, error: catError } = await supabase
                    .from('categories')
                    .insert({ name: 'Sales', type: 'revenue' as const })
                    .select('id')
                    .single()
                if (catError) throw catError
                salesCategory = newCategory
            }

            if (salesCategory) {
                await supabase
                    .from('transactions')
                    .insert({
                        type: 'revenue' as const,
                        category_id: salesCategory.id,
                        amount: newTotalAmount,
                        account_id: arAccount.id,
                        client_id: validData.client_id || oldInvoice.client_id || null,
                        invoice_id: id,
                        date: validData.date || oldInvoice.date,
                        description: `Invoice ${oldInvoice.document_number} - Revenue recognition`,
                    })
            }
        }

        // Handle amount adjustments on already-sent invoices
        if (oldIsSent && arAccount) {
            const amountChange = newTotalAmount - oldTotalAmount

            if (Math.abs(amountChange) > 0.005) { // Avoid floating point noise
                const { data: salesCategory } = await supabase
                    .from('categories')
                    .select('id')
                    .eq('name', 'Sales')
                    .eq('type', 'revenue')
                    .single()

                if (salesCategory) {
                    // FIX: Always use positive amounts. Use 'revenue' for increases, 'expense' for decreases.
                    // This maintains the "amounts are always positive" invariant.
                    await supabase
                        .from('transactions')
                        .insert({
                            type: amountChange > 0 ? 'revenue' as const : 'expense' as const,
                            category_id: salesCategory.id,
                            amount: Math.abs(amountChange),
                            account_id: arAccount.id,
                            client_id: validData.client_id || oldInvoice.client_id || null,
                            invoice_id: id,
                            date: validData.date || oldInvoice.date,
                            description: amountChange > 0
                                ? `Invoice ${oldInvoice.document_number} - AR adjustment (increase)`
                                : `Invoice ${oldInvoice.document_number} - AR adjustment (decrease)`,
                        })
                }
            }
        }

        // Handle advance payment changes
        const advanceChange = (validData.advance_paid || 0) - (oldInvoice.advance_paid || 0)
        const isSent = newIsSent || oldIsSent

        if (isSent && Math.abs(advanceChange) > 0.005 && payment_account_id && arAccount) {
            // FIX: Always use positive amounts for transfers. Direction is determined by account_id/to_account_id.
            const { error: payError } = await supabase
                .from('transactions')
                .insert({
                    type: 'transfer' as const,
                    amount: Math.abs(advanceChange),
                    account_id: advanceChange > 0 ? arAccount.id : payment_account_id,
                    to_account_id: advanceChange > 0 ? payment_account_id : arAccount.id,
                    client_id: validData.client_id || oldInvoice.client_id || null,
                    invoice_id: id,
                    date: validData.date || oldInvoice.date,
                    description: advanceChange > 0
                        ? `Payment received for ${oldInvoice.document_number}`
                        : `Payment reversal for ${oldInvoice.document_number}`,
                })

            if (payError) throw payError
        }

        // Fetch updated invoice
        const { data, error } = await supabase
            .from('invoices')
            .select(`*, client:clients(*), items:invoice_items(*)`)
            .eq('id', id)
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Invoice PUT error:', error)
        return NextResponse.json(
            { error: 'Failed to update invoice' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

        // Delete associated transactions first
        const { error: txError } = await supabase
            .from('transactions')
            .delete()
            .eq('invoice_id', id)

        if (txError) throw txError

        // Delete invoice items
        const { error: itemsError } = await supabase
            .from('invoice_items')
            .delete()
            .eq('invoice_id', id)

        if (itemsError) throw itemsError

        // Delete the invoice
        const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Invoice DELETE error:', error)
        return NextResponse.json(
            { error: 'Failed to delete invoice' },
            { status: 500 }
        )
    }
}
