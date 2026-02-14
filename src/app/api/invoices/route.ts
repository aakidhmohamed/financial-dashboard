import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)

        const type = searchParams.get('type') // 'quotation' | 'invoice'
        const status = searchParams.get('status')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '50')
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

        const { items, ...invoiceData } = body

        // Calculate subtotal from items
        const subtotal = items.reduce(
            (sum: number, item: { quantity: number; unit_price: number }) =>
                sum + item.quantity * item.unit_price,
            0
        )
        invoiceData.subtotal = subtotal

        // Insert invoice
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert(invoiceData)
            .select('*')
            .single()

        if (invoiceError) throw invoiceError

        // Insert items
        if (items && items.length > 0) {
            const itemsWithInvoiceId = items.map(
                (item: { description: string; quantity: number; unit_price: number }, index: number) => ({
                    invoice_id: invoice.id,
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

        // Create Accounts Receivable transactions when invoice is sent (not drafts/quotations)
        const shouldCreateAR = (invoice as any).status === 'sent' && (invoice as any).document_type === 'invoice'

        if (shouldCreateAR) {
            // Calculate total invoice amount
            const totalAmount = subtotal
                - ((invoice as any).discount || 0)
                + (subtotal - ((invoice as any).discount || 0)) * (((invoice as any).tax_rate || 0) / 100)
                + ((invoice as any).shipping || 0)

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
            await supabase
                .from('transactions')
                .insert({
                    type: 'revenue',
                    category_id: (salesCategory as any).id,
                    amount: totalAmount,
                    account_id: (arAccount as any).id,
                    client_id: (invoice as any).client_id,
                    invoice_id: (invoice as any).id,
                    date: (invoice as any).date,
                    description: `Invoice ${(invoice as any).document_number} - Revenue recognition`,
                } as any)
        }

        // Fetch the complete invoice with relations
        const { data: result, error: fetchError } = await supabase
            .from('invoices')
            .select(`*, client:clients(*), items:invoice_items(*)`)
            .eq('id', (invoice as any).id)
            .single()

        if (fetchError) throw fetchError

        return NextResponse.json(result, { status: 201 })
    } catch (error: any) {
        console.error('Invoices POST error:', error)
        return NextResponse.json(
            { error: `Failed to create invoice: ${error.message || JSON.stringify(error)}` },
            { status: 500 }
        )
    }
}
