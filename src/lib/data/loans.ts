import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import type { LoanWithPayments, LoanSummary, Loan } from '@/lib/types'

export const getLoans = cache(async (): Promise<LoanWithPayments[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('loans')
        .select(`
            *,
            loan_payments(*),
            account:accounts!loans_account_id_fkey(*),
            liability_account:accounts!loans_liability_account_id_fkey(*)
        `)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching loans:', error)
        return []
    }

    return data as LoanWithPayments[]
})

export const getLoan = cache(async (id: string): Promise<LoanWithPayments | null> => {
    const supabase = await createClient()
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

    if (error) {
        console.error('Error fetching loan:', error)
        return null
    }

    return data as LoanWithPayments
})

function calcSummaryForDirection(loans: Pick<Loan, 'amount' | 'remaining_balance' | 'status'>[]) {
    return {
        totalOutstanding: loans
            .filter(l => l.status === 'active')
            .reduce((sum, l) => sum + Number(l.remaining_balance), 0),
        totalPrincipal: loans.reduce((sum, l) => sum + Number(l.amount), 0),
        activeCount: loans.filter(l => l.status === 'active').length,
        paidCount: loans.filter(l => l.status === 'paid').length,
    }
}

export const getLoanSummary = cache(async (): Promise<LoanSummary> => {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('loans')
        .select('amount, remaining_balance, status, direction')

    if (error) {
        console.error('Error fetching loan summary:', error)
        const empty = { totalOutstanding: 0, totalPrincipal: 0, activeCount: 0, paidCount: 0 }
        return { ...empty, borrowed: empty, lent: empty }
    }

    const loans = (data as Pick<Loan, 'amount' | 'remaining_balance' | 'status' | 'direction'>[]) || []
    const borrowed = loans.filter(l => l.direction === 'borrowed')
    const lent = loans.filter(l => l.direction === 'lent')

    return {
        ...calcSummaryForDirection(loans),
        borrowed: calcSummaryForDirection(borrowed),
        lent: calcSummaryForDirection(lent),
    }
})
