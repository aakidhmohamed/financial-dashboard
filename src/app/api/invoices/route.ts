import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { invoiceSchema } from '@/lib/validations'
import { calcSubtotal, calcInvoiceTotal } from '@/lib/invoice-utils'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)

        const type = searchParams.get('type')
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
        const offset = (page - 1) * limit

        let query = supabase
            .from('invoices')
            .select(`*, client:clients(*)`, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (type) {
            query = query.eq('document_type', type)
        }

        if (status) {
            query = query.eq('status', status)
        }

        const { data, error, count } = await query

        if (error) throw error

        return NextResponse.json({
            data: data || [],
            total: count || 0,
            page,
            limit,
        })
    } catch (error) {
        console.error('Invoices GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch invoices' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        // Server-side validation
        const parsed = invoiceSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const { items, ...rest } = parsed.data

        // Calculate subtotal from validated items using shared utility
        const subtotal = calcSubtotal(items)

        const invoiceData = {
            document_type: rest.document_type,
            document_number: rest.document_number,
            date: rest.date,
            client_id: rest.client_id || null,
            subtotal,
            discount: rest.discount,
            tax_rate: rest.tax_rate,
            shipping: rest.shipping,
            advance_paid: rest.advance_paid,
            remarks: rest.remarks || null,
            status: rest.status,
            quotation_id: rest.quotation_id || null,
        }

        // Insert invoice
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert(invoiceData)
            .select('*')
            .single()

        if (invoiceError) throw invoiceError

        // Insert items
        if (items.length > 0) {
            const itemsWithInvoiceId = items.map(
                (item, index) => ({
                    invoice_id: invoice.id,
                    description: item.description,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total: Math.round(item.quantity * item.unit_price * 100) / 100,
                    sort_order: index,
                })
            )

            const { error: itemsError } = await supabase
                .from('invoice_items')
                .insert(itemsWithInvoiceId)

            if (itemsError) throw itemsError
        }

        // Create AR transaction if sent invoice (revenue recognition)
        if (invoice.status === 'sent' && invoice.document_type === 'invoice') {
            const totalAmount = calcInvoiceTotal(
                subtotal,
                invoice.discount,
                invoice.tax_rate,
                invoice.shipping
            )

            // Find or create Accounts Receivable account
            let { data: arAccount } = await supabase
                .from('accounts')
                .select('id')
                .eq('name', 'Accounts Receivable')
                .eq('type', 'asset')
                .single()

            if (!arAccount) {
                const { data: newAR, error: arError } = await supabase
                    .from('accounts')
                    .insert({ name: 'Accounts Receivable', type: 'asset' as const, balance: 0 })
                    .select('id')
                    .single()
                if (arError) throw arError
                arAccount = newAR
            }

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
                    .insert({ name: 'Sales', type: 'revenue' as const })
                    .select('id')
                    .single()
                if (catError) throw catError
                salesCategory = newCategory
            }

            if (arAccount && salesCategory) {
                await supabase
                    .from('transactions')
                    .insert({
                        type: 'revenue' as const,
                        category_id: salesCategory.id,
                        amount: totalAmount,
                        account_id: arAccount.id,
                        client_id: invoice.client_id,
                        invoice_id: invoice.id,
                        date: invoice.date,
                        description: `Invoice ${invoice.document_number} - Revenue recognition`,
                    })
            }
        }

        // Fetch the complete invoice with relations
        const { data: result, error: fetchError } = await supabase
            .from('invoices')
            .select(`*, client:clients(*), items:invoice_items(*)`)
            .eq('id', invoice.id)
            .single()

        if (fetchError) throw fetchError

        return NextResponse.json(result, { status: 201 })
    } catch (error) {
        console.error('Invoices POST error:', error)
        return NextResponse.json(
            { error: 'Failed to create invoice' },
            { status: 500 }
        )
    }
}
