import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loanPaymentSchema } from '@/lib/validations'

const LOAN_REPAYMENT_CATEGORY_ID = '00305090-76e3-460f-ac6b-b8b1721a4bf2'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

        const { data, error } = await supabase
            .from('loan_payments')
            .select('*')
            .eq('loan_id', id)
            .order('date', { ascending: false })

        if (error) throw error

        return NextResponse.json({ data: data || [] })
    } catch (error) {
        console.error('Loan payments GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch loan payments' },
            { status: 500 }
        )
    }
}

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params
        const body = await request.json()

        const parsed = loanPaymentSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        // Check loan exists and is active
        const { data: loan, error: loanError } = await supabase
            .from('loans')
            .select('id, remaining_balance, status, person_name, direction, account_id, liability_account_id')
            .eq('id', id)
            .single()

        if (loanError || !loan) {
            return NextResponse.json(
                { error: 'Loan not found' },
                { status: 404 }
            )
        }

        if (loan.status === 'paid') {
            return NextResponse.json(
                { error: 'This loan is already fully paid' },
                { status: 400 }
            )
        }

        if (parsed.data.amount > Number(loan.remaining_balance)) {
            return NextResponse.json(
                { error: `Payment amount exceeds remaining balance of ${loan.remaining_balance}` },
                { status: 400 }
            )
        }

        const { data, error } = await supabase
            .from('loan_payments')
            .insert({
                loan_id: id,
                amount: parsed.data.amount,
                date: parsed.data.date,
                notes: parsed.data.notes || null,
            })
            .select('*')
            .single()

        if (error) throw error

        // Auto-create transaction log (skip_balance_update prevents double-counting)
        const isBorrowed = loan.direction === 'borrowed'
        await supabase
            .from('transactions')
            .insert({
                date: parsed.data.date,
                type: 'transfer' as const,
                category_id: LOAN_REPAYMENT_CATEGORY_ID,
                amount: parsed.data.amount,
                description: `Loan ${isBorrowed ? 'repayment to' : 'received from'} ${loan.person_name}`,
                account_id: loan.account_id,
                to_account_id: loan.liability_account_id,
                skip_balance_update: true,
            })

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error('Loan payment POST error:', error)
        return NextResponse.json(
            { error: 'Failed to record payment' },
            { status: 500 }
        )
    }
}
