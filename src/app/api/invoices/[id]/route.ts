import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

        // Fetch current invoice data to detect changes
        const { data: oldInvoice, error: fetchError } = await supabase
            .from('invoices')
            .select('advance_paid, client_id, date, document_number, subtotal, discount, tax_rate, shipping, status, document_type')
            .eq('id', id)
            .single()

        if (fetchError) throw fetchError

        const { items, payment_account_id, ...invoiceData } = body

        // Recalculate subtotal if items provided
        if (items) {
            invoiceData.subtotal = items.reduce(
                (sum: number, item: { quantity: number; unit_price: number }) =>
                    sum + item.quantity * item.unit_price,
                0
            )
        }

        invoiceData.updated_at = new Date().toISOString()

        const { error: updateError } = await supabase
            .from('invoices')
            .update(invoiceData)
            .eq('id', id)

        if (updateError) throw updateError

        // Replace items if provided
        if (items) {
            // Delete old items
            await supabase.from('invoice_items').delete().eq('invoice_id', id)

            // Insert new items
            const itemsWithInvoiceId = items.map(
                (item: { description: string; quantity: number; unit_price: number }, index: number) => ({
                    invoice_id: id,
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total: item.quantity * item.unit_price,
                    sort_order: index,
                })
            )

            const { error: itemsError } = await supabase
                .from('invoice_items')
                .insert(itemsWithInvoiceId)

            if (itemsError) throw itemsError
        }

        // Calculate old and new total amounts (needed for AR logic)
        const oldSubtotal = (oldInvoice as any).subtotal || 0
        const oldDiscount = (oldInvoice as any).discount || 0
        const oldTaxRate = (oldInvoice as any).tax_rate || 0
        const oldShipping = (oldInvoice as any).shipping || 0
        const oldTotalAmount = (oldSubtotal - oldDiscount) * (1 + oldTaxRate / 100) + oldShipping

        const newSubtotal = invoiceData.subtotal !== undefined ? invoiceData.subtotal : oldSubtotal
        const newDiscount = invoiceData.discount !== undefined ? invoiceData.discount : oldDiscount
        const newTaxRate = invoiceData.tax_rate !== undefined ? invoiceData.tax_rate : oldTaxRate
        const newShipping = invoiceData.shipping !== undefined ? invoiceData.shipping : oldShipping
        const newTotalAmount = (newSubtotal - newDiscount) * (1 + newTaxRate / 100) + newShipping

        // Only process AR logic if invoice is sent (or becoming sent) OR paid
        const oldIsSent = ((oldInvoice as any).status === 'sent' || (oldInvoice as any).status === 'paid') && (oldInvoice as any).document_type === 'invoice'
        const newIsSent = (invoiceData.status === 'sent' || invoiceData.status === 'paid') && (oldInvoice as any).document_type === 'invoice'

        // Prepare Common Accounts (AR, Sales)
        // We fetch/create them if needed, because payment logic needs AR account even for Drafts
        let { data: arAccount } = await supabase
            .from('accounts')
            .select('id')
            .eq('name', 'Accounts Receivable')
            .eq('type', 'asset')
            .single()

        if (!arAccount) {
            const { data: newAR, error: arError } = await supabase
                .from('accounts')
                .insert({
                    name: 'Accounts Receivable',
                    type: 'asset',
                    balance: 0,
                } as any)
                .select('id')
                .single()
            if (arError) throw arError
            arAccount = newAR
        }

        // Handle Status Change: Draft -> Sent/Paid (Revenue Recognition)
        if (!oldIsSent && newIsSent) {
            // Find or create Sales Revenue category
            let { data: salesCategory } = await supabase
                .from('categories')
                .select('id')
                .eq('name', 'Sales')
                .eq('type', 'revenue')
                .single()

            if (!salesCategory) {
                const { data: newCategory, error: catError } = await supabase
                    .from('categories')
                    .insert({
                        name: 'Sales',
                        type: 'revenue',
                    } as any)
                    .select('id')
                    .single()
                if (catError) throw catError
                salesCategory = newCategory
            }

            // Create AR transaction (Debit Accounts Receivable, Credit Revenue)
            // Use newTotalAmount calculated above
            await supabase
                .from('transactions')
                .insert({
                    type: 'revenue',
                    category_id: (salesCategory as any).id,
                    amount: newTotalAmount,
                    account_id: (arAccount as any).id,
                    client_id: body.client_id || (oldInvoice as any).client_id,
                    invoice_id: id,
                    date: body.date || (oldInvoice as any).date,
                    description: `Invoice ${(oldInvoice as any).document_number} - Revenue recognition`,
                } as any)
        }

        if (oldIsSent) { // Logic for existing sent invoices (adjustments)
            if (arAccount) {
                // Handle invoice amount changes (AR adjustments)
                const amountChange = newTotalAmount - oldTotalAmount

                if (amountChange !== 0) {
                    // Find Sales category
                    const { data: salesCategory } = await supabase
                        .from('categories')
                        .select('id')
                        .eq('name', 'Sales')
                        .eq('type', 'revenue')
                        .single()

                    if (salesCategory) {
                        // Create AR adjustment transaction
                        await supabase
                            .from('transactions')
                            .insert({
                                type: 'revenue',
                                category_id: (salesCategory as any).id,
                                amount: Math.abs(amountChange),
                                account_id: (arAccount as any).id,
                                client_id: body.client_id || (oldInvoice as any).client_id,
                                invoice_id: id,
                                date: body.date || (oldInvoice as any).date,
                                description: amountChange > 0
                                    ? `Invoice ${(oldInvoice as any).document_number} - AR adjustment (increase)`
                                    : `Invoice ${(oldInvoice as any).document_number} - AR adjustment (decrease)`,
                                ...(amountChange < 0 && { amount: -Math.abs(amountChange) })
                            } as any)
                    }
                }
            }
        }

        // Handle advance payment changes (AR → Cash transfers)
        // STRICT ACCRUAL: Payments only recorded if invoice is Sent (or becoming Sent)
        const advanceChange = (body.advance_paid || 0) - ((oldInvoice as any)?.advance_paid || 0)

        // Check if invoice will be in 'sent' state after this update
        const isSent = newIsSent || oldIsSent

        if (isSent && advanceChange !== 0 && payment_account_id && arAccount) {
            // Create transfer transaction: AR → Cash
            // If AR balance becomes negative (because invoice is draft/unpaid), it represents Customer Deposit (Liability)
            const transactionDescription = advanceChange > 0
                ? `Payment received for ${(oldInvoice as any).document_number}`
                : `Payment reversal for ${(oldInvoice as any).document_number}`

            const { error: payError } = await supabase
                .from('transactions')
                .insert({
                    type: 'transfer',
                    amount: Math.abs(advanceChange),
                    account_id: (arAccount as any).id, // Source (AR) - Decreases
                    to_account_id: payment_account_id, // Destination (Cash/Bank) - Increases
                    client_id: body.client_id || (oldInvoice as any).client_id,
                    invoice_id: id,
                    date: body.date || (oldInvoice as any).date,
                    description: transactionDescription,
                    ...(advanceChange < 0 && { amount: -Math.abs(advanceChange) })
                } as any)

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
            { error: `Failed to update invoice: ${(error as any).message || error}` },
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

        // First delete associated transactions to ensure account balances are updated
        // This triggers the database to reverse the balance changes
        const { error: txError } = await supabase
            .from('transactions')
            .delete()
            .eq('invoice_id', id)

        if (txError) throw txError

        // Delete invoice items (redundant if cascade exists, but safe)
        const { error: itemsError } = await supabase
            .from('invoice_items')
            .delete()
            .eq('invoice_id', id)

        if (itemsError) throw itemsError

        // Finally delete the invoice
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
