import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loanSchema } from '@/lib/validations'

// Category IDs for auto-created transaction logs
const LOAN_PRINCIPAL_CATEGORY_ID = 'a4d0cf74-694d-4751-b0a1-93cb118d9c14'
const LOAN_GIVEN_CATEGORY_ID = '279d9be6-1ca9-4ddb-a866-2addd5093e09'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const status = searchParams.get('status')
        const direction = searchParams.get('direction')

        let query = supabase
            .from('loans')
            .select(`
                *,
                loan_payments(*),
                account:accounts!loans_account_id_fkey(*),
                liability_account:accounts!loans_liability_account_id_fkey(*)
            `)
            .order('created_at', { ascending: false })

        if (status) {
            query = query.eq('status', status)
        }
        if (direction) {
            query = query.eq('direction', direction)
        }

        const { data, error } = await query

        if (error) throw error

        return NextResponse.json({ data: data || [] })
    } catch (error) {
        console.error('Loans GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch loans' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        const parsed = loanSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const validData = parsed.data

        const { data, error } = await supabase
            .from('loans')
            .insert({
                person_name: validData.person_name,
                direction: validData.direction,
                amount: validData.amount,
                remaining_balance: validData.amount,
                start_date: validData.start_date,
                notes: validData.notes || null,
                account_id: validData.account_id,
                liability_account_id: validData.liability_account_id,
            })
            .select(`
                *,
                loan_payments(*),
                account:accounts!loans_account_id_fkey(*),
                liability_account:accounts!loans_liability_account_id_fkey(*)
            `)
            .single()

        if (error) throw error

        // Auto-create transaction log (skip_balance_update prevents double-counting)
        const isBorrowed = validData.direction === 'borrowed'
        await supabase
            .from('transactions')
            .insert({
                date: validData.start_date,
                type: isBorrowed ? 'loan' : 'transfer',
                category_id: isBorrowed ? LOAN_PRINCIPAL_CATEGORY_ID : LOAN_GIVEN_CATEGORY_ID,
                amount: validData.amount,
                description: `${isBorrowed ? 'Loan from' : 'Loan to'} ${validData.person_name}`,
                account_id: isBorrowed ? validData.account_id : validData.liability_account_id,
                to_account_id: isBorrowed ? validData.liability_account_id : validData.account_id,
                skip_balance_update: true,
            })

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error('Loans POST error:', error)
        return NextResponse.json(
            { error: 'Failed to create loan' },
            { status: 500 }
        )
    }
}

