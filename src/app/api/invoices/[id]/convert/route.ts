import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Convert a quotation to an invoice
export async function POST(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

        // Fetch the quotation
        const { data: quotation, error: fetchError } = await supabase
            .from('invoices')
            .select(`*, items:invoice_items(*)`)
            .eq('id', id)
            .eq('document_type', 'quotation')
            .single()

        if (fetchError || !quotation) {
            return NextResponse.json(
                { error: 'Quotation not found' },
                { status: 404 }
            )
        }

        // Get the next invoice number
        const { data: lastInvoice } = await supabase
            .from('invoices')
            .select('document_number')
            .eq('document_type', 'invoice')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        let nextNum = 1
        if (lastInvoice?.document_number) {
            const match = lastInvoice.document_number.match(/(\d+)$/)
            if (match) nextNum = parseInt(match[1]) + 1
        }
        const invoiceNumber = `INV ${String(nextNum).padStart(4, '0')}`

        // Create invoice from quotation data
        const { data: invoice, error: insertError } = await supabase
            .from('invoices')
            .insert({
                document_type: 'invoice' as const,
                document_number: invoiceNumber,
                date: new Date().toISOString().split('T')[0],
                client_id: quotation.client_id,
                subtotal: quotation.subtotal,
                discount: quotation.discount,
                tax_rate: quotation.tax_rate,
                shipping: quotation.shipping,
                advance_paid: quotation.advance_paid,
                remarks: quotation.remarks,
                status: 'draft' as const,
                quotation_id: quotation.id,
            })
            .select('*')
            .single()

        if (insertError) throw insertError

        // Copy items
        if (quotation.items && quotation.items.length > 0) {
            const newItems = quotation.items.map(
                (item: { description: string; quantity: number; unit_price: number; total: number; sort_order: number }) => ({
                    invoice_id: invoice.id,
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total: item.total,
                    sort_order: item.sort_order,
                })
            )

            const { error: itemsError } = await supabase
                .from('invoice_items')
                .insert(newItems)

            if (itemsError) throw itemsError
        }

        // Mark quotation as accepted
        await supabase
            .from('invoices')
            .update({ status: 'accepted' })
            .eq('id', id)

        // Fetch the complete new invoice
        const { data: result, error: resultError } = await supabase
            .from('invoices')
            .select(`*, client:clients(*), items:invoice_items(*)`)
            .eq('id', invoice.id)
            .single()

        if (resultError) throw resultError

        return NextResponse.json(result, { status: 201 })
    } catch (error) {
        console.error('Convert quotation error:', error)
        return NextResponse.json(
            { error: 'Failed to convert quotation to invoice' },
            { status: 500 }
        )
    }
}
