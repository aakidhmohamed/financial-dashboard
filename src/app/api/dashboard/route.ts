import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Account, DashboardSummary, TransactionWithRelations } from '@/lib/types'

export async function GET(request: Request) {
    try {
        const supabase = await createClient()

        // Get all accounts
        const { data: accountsRaw, error: accountsError } = await supabase
            .from('accounts')
            .select('*')
            .order('type', { ascending: true })

        if (accountsError) throw accountsError
        const accounts = accountsRaw as Account[]

        // Calculate totals
        const totalAssets = accounts
            ?.filter(a => a.type === 'asset')
            .reduce((sum, a) => sum + Number(a.balance), 0) || 0

        const totalLiabilities = accounts
            ?.filter(a => a.type === 'liability')
            .reduce((sum, a) => sum + Number(a.balance), 0) || 0

        const netWorth = totalAssets - totalLiabilities

        const cashAccount = accounts?.find(a => a.name === 'Cash')
        const cashBalance = cashAccount ? Number(cashAccount.balance) : 0

        const { searchParams } = new URL(request.url)
        const from = searchParams.get('from')
        const to = searchParams.get('to')

        // Default to this month if no dates provided
        const now = new Date()
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

        const startDate = from || firstDayOfMonth.toISOString().split('T')[0]
        const endDate = to || lastDayOfMonth.toISOString().split('T')[0]

        // Get transactions for the selected period
        const { data: transactionsRaw, error: transactionsError } = await supabase
            .from('transactions')
            .select(`
        *,
        category:categories(*),
        client:clients(*),
        supplier:suppliers(*),
        account:accounts!transactions_account_id_fkey(*),
        to_account:accounts!transactions_to_account_id_fkey(*)
      `)
            .gte('date', startDate)
            .lte('date', endDate)

        if (transactionsError) throw transactionsError
        const transactions = transactionsRaw as TransactionWithRelations[]

        const revenueThisMonth = transactions
            ?.filter(t => t.type === 'revenue')
            .reduce((sum, t) => sum + Number(t.amount), 0) || 0

        const expensesThisMonth = transactions
            ?.filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + Number(t.amount), 0) || 0

        const capitalThisMonth = transactions
            ?.filter(t => t.type === 'capital')
            .reduce((sum, t) => sum + Number(t.amount), 0) || 0

        const netProfitThisMonth = revenueThisMonth - expensesThisMonth

        // Get recent transactions
        const { data: recentTransactionsRaw, error: recentError } = await supabase
            .from('transactions')
            .select(`
        *,
        category:categories(*),
        client:clients(*),
        supplier:suppliers(*),
        account:accounts!transactions_account_id_fkey(*),
        to_account:accounts!transactions_to_account_id_fkey(*)
      `)
            .order('created_at', { ascending: false })
            .limit(10)

        if (recentError) throw recentError
        const recentTransactions = recentTransactionsRaw as TransactionWithRelations[]

        // Get upcoming renewals (next 30 days)
        const thirtyDaysFromNow = new Date()
        thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

        const { data: renewals, error: renewalsError } = await supabase
            .from('renewals')
            .select('*')
            .eq('status', 'pending')
            .lte('renewal_date', thirtyDaysFromNow.toISOString().split('T')[0])

        if (renewalsError) throw renewalsError

        const upcomingRenewals = renewals?.length || 0

        const summary: DashboardSummary = {
            netWorth,
            totalAssets,
            totalLiabilities,
            cashBalance,
            revenueThisMonth,
            expensesThisMonth,
            netProfitThisMonth,
            capitalThisMonth,
            upcomingRenewals,
            accountBalances: accounts || [],
            recentTransactions: recentTransactions || [],
        }

        return NextResponse.json(summary)
    } catch (error) {
        console.error('Dashboard API error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        )
    }
}
