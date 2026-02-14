import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import type { Account, DashboardSummary, TransactionWithRelations } from '@/lib/types'

export const getDashboardData = cache(async (from?: string, to?: string): Promise<DashboardSummary> => {
    const supabase = await createClient()

    // Date range calculation
    const now = new Date()
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const startDate = from || firstDayOfMonth.toISOString().split('T')[0]
    const endDate = to || lastDayOfMonth.toISOString().split('T')[0]

    // Parallel queries
    const [
        { data: accounts },
        { data: periodTransactions },
        { data: recentTransactions },
        { count: upcomingRenewals }
    ] = await Promise.all([
        // 1. All Accounts (for Net Worth, Asset/Liability totals, Cash Balance)
        supabase
            .from('accounts')
            .select('*')
            .order('type', { ascending: true }),

        // 2. Period Transactions (Optimized: only needed fields for totals)
        supabase
            .from('transactions')
            .select('amount, type')
            .gte('date', startDate)
            .lte('date', endDate),

        // 3. Recent Transactions (Full details with relations, limit 10)
        supabase
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
            .limit(10),

        // 4. Upcoming Renewals (Count only)
        supabase
            .from('renewals')
            .select('*', { count: 'exact', head: true }) // head: true means usually count only, but check supabase js
            .eq('status', 'pending')
            .lte('renewal_date', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    ])

    const safeAccounts = (accounts as Account[]) || []
    const safePeriodTx = (periodTransactions as unknown as Pick<TransactionWithRelations, 'amount' | 'type'>[]) || []
    const safeRecentTx = (recentTransactions as TransactionWithRelations[]) || []

    // Calculations
    const totalAssets = safeAccounts
        .filter(a => a.type === 'asset')
        .reduce((sum, a) => sum + Number(a.balance), 0)

    const totalLiabilities = safeAccounts
        .filter(a => a.type === 'liability')
        .reduce((sum, a) => sum + Number(a.balance), 0)

    const netWorth = totalAssets - totalLiabilities

    const cashAccount = safeAccounts.find(a => a.name === 'Cash' || a.name === 'Bank') // Adjusted logic slightly to be safe
    const cashBalance = cashAccount ? Number(cashAccount.balance) : 0

    // Period Totals
    const revenueThisMonth = safePeriodTx
        .filter(t => t.type === 'revenue')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const expensesThisMonth = safePeriodTx
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const capitalThisMonth = safePeriodTx
        .filter(t => t.type === 'capital')
        .reduce((sum, t) => sum + Number(t.amount), 0)

    const netProfitThisMonth = revenueThisMonth - expensesThisMonth

    return {
        netWorth,
        totalAssets,
        totalLiabilities,
        cashBalance,
        revenueThisMonth,
        expensesThisMonth,
        netProfitThisMonth,
        capitalThisMonth,
        upcomingRenewals: upcomingRenewals || 0,
        accountBalances: safeAccounts,
        recentTransactions: safeRecentTx,
    }
})
