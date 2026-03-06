import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { transactionSchema } from '@/lib/validations'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)

        const type = searchParams.get('type')
        const categoryId = searchParams.get('category_id')
        const page = parseInt(searchParams.get('page') || '1')
        const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100) // Cap at 100
        const offset = (page - 1) * limit

        let query = supabase
            .from('transactions')
            .select(`
                *,
                category:categories(*),
                client:clients(*),
                supplier:suppliers(*),
                account:accounts!transactions_account_id_fkey(*),
                to_account:accounts!transactions_to_account_id_fkey(*)
            `, { count: 'exact' })
            .order('date', { ascending: false })
            .range(offset, offset + limit - 1)

        if (type) {
            query = query.eq('type', type)
        }

        if (categoryId) {
            query = query.eq('category_id', categoryId)
        }

        const invoiceId = searchParams.get('invoice_id')
        if (invoiceId) {
            query = query.eq('invoice_id', invoiceId)
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
        console.error('Transactions GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch transactions' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        // Server-side validation
        const parsed = transactionSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const validData = parsed.data

        const { data, error } = await supabase
            .from('transactions')
            .insert({
                date: validData.date,
                type: validData.type,
                category_id: validData.category_id,
                amount: validData.amount,
                description: validData.description || null,
                client_id: validData.client_id || null,
                supplier_id: validData.supplier_id || null,
                account_id: validData.account_id,
                to_account_id: (validData.type === 'transfer' || validData.type === 'loan')
                    ? (validData.to_account_id || null)
                    : null,
            })
            .select(`
                *,
                category:categories(*),
                client:clients(*),
                supplier:suppliers(*),
                account:accounts!transactions_account_id_fkey(*),
                to_account:accounts!transactions_to_account_id_fkey(*)
            `)
            .single()

        if (error) throw error

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error('Transactions POST error:', error)
        return NextResponse.json(
            { error: 'Failed to create transaction' },
            { status: 500 }
        )
    }
}
