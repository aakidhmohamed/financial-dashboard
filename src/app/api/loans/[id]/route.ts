import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

        const { data, error } = await supabase
            .from('loans')
            .select(`
                *,
                loan_payments(*),
                account:accounts!loans_account_id_fkey(*),
                liability_account:accounts!loans_liability_account_id_fkey(*)
            `)
            .eq('id', id)
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Loan GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch loan' },
            { status: 500 }
        )
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params
        const body = await request.json()

        // Only allow updating status and notes
        const updateData: Record<string, unknown> = {}
        if (body.status) updateData.status = body.status
        if (body.notes !== undefined) updateData.notes = body.notes
        updateData.updated_at = new Date().toISOString()

        const { data, error } = await supabase
            .from('loans')
            .update(updateData)
            .eq('id', id)
            .select(`
                *,
                loan_payments(*),
                account:accounts!loans_account_id_fkey(*),
                liability_account:accounts!loans_liability_account_id_fkey(*)
            `)
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Loan PATCH error:', error)
        return NextResponse.json(
            { error: 'Failed to update loan' },
            { status: 500 }
        )
    }
}
