import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { MetricCard } from '@/components/ui/metric-card'
import { TransactionListItem } from '@/components/ui/transaction-list-item'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { DateRangeFilter } from '@/components/dashboard/date-range-filter'
import { formatCurrency } from '@/lib/utils'
import { AlertCircle, ArrowUpRight, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import Link from 'next/link'

import { getDashboardData } from '@/lib/data/dashboard'


export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string; to?: string }>
}) {
    const resolvedParams = await searchParams
    const data = await getDashboardData(resolvedParams?.from, resolvedParams?.to)

    return (
        <div className="p-4 md:p-8 space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-1">Dashboard</h1>
                    <p className="text-muted-foreground text-sm">
                        Real-time overview of your net worth and liquidity.
                    </p>
                </div>
                <DateRangeFilter />
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                <MetricCard
                    title="Net Worth"
                    value={data.netWorth}
                    highlighted={true}
                    subtitle="Total Assets - Liabilities"
                />
                <MetricCard
                    title="Cash (Liquidity)"
                    value={data.cashBalance}
                    subtitle="Available right now"
                />
                <MetricCard
                    title="Loans Receivable"
                    value={data.accountBalances.find(a => a.name === 'Loans Receivable')?.balance || 0}
                    subtitle="Money owed to you"
                />
                <MetricCard
                    title="Loans Payable"
                    value={data.accountBalances.find(a => a.name === 'Debts')?.balance || 0}
                    subtitle="Money you owe"
                />
                <MetricCard
                    title="Revenue (This Month)"
                    value={data.revenueThisMonth}
                    subtitle="From all sources"
                />
                <MetricCard
                    title="Net Profit"
                    value={data.netProfitThisMonth}
                    trend={data.netProfitThisMonth >= 0 ? 'up' : 'down'}
                    subtitle={`Expenses: ${formatCurrency(data.expensesThisMonth)}`}
                />
                <MetricCard
                    title="Capital (This Month)"
                    value={data.capitalThisMonth}
                    subtitle="New investments"
                />
            </div>

            {/* Row 2: Charts / Analytics + Renewals + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-5">
                {/* Revenue Chart — now uses REAL data */}
                <Card>
                    <CardHeader>
                        <CardTitle>Revenue Analytics</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <RevenueChart data={data.dailyRevenue} />
                    </CardContent>
                </Card>

                {/* Reminders / Renewals */}
                <Card>
                    <CardHeader>
                        <CardTitle>Reminders</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {data.upcomingRenewals > 0 ? (
                            <div className="space-y-4">
                                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <p className="font-semibold text-amber-800">Support Renewals Due</p>
                                            <p className="text-sm text-amber-600 mt-1">
                                                {data.upcomingRenewals} renewal{data.upcomingRenewals > 1 ? 's' : ''} in the next 30 days
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <Link
                                    href="/renewals"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all w-full justify-center"
                                >
                                    View Renewals
                                </Link>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mb-3">
                                    <AlertCircle className="w-6 h-6 text-primary" />
                                </div>
                                <p className="font-semibold text-foreground">All Clear!</p>
                                <p className="text-sm text-muted-foreground mt-1">No upcoming reminders</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Quick Account Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle>Accounts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {data.accountBalances.slice(0, 5).map(account => (
                                <div
                                    key={account.id}
                                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-secondary/50 transition-colors"
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${account.type === 'asset' ? 'bg-emerald-50' : 'bg-red-50'
                                        }`}>
                                        {account.type === 'asset' ? (
                                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                            <TrendingDown className="w-4 h-4 text-red-500" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{account.name}</p>
                                        <p className="text-xs text-muted-foreground capitalize">{account.type}</p>
                                    </div>
                                    <p className={`text-sm font-bold ${account.type === 'asset' ? 'text-foreground' : 'text-red-500'
                                        }`}>
                                        {formatCurrency(Number(account.balance))}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Row 3: Balance Sheet + Recent Transactions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
                {/* Balance Sheet */}
                <Card>
                    <CardHeader>
                        <CardTitle>Balance Sheet</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-6">
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-emerald-600">Assets</h4>
                                    <p className="text-sm font-bold text-emerald-600">
                                        {formatCurrency(data.totalAssets)}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {data.accountBalances
                                        .filter(a => a.type === 'asset')
                                        .map(account => (
                                            <div
                                                key={account.id}
                                                className="flex justify-between items-center p-3 bg-emerald-50/50 rounded-xl"
                                            >
                                                <span className="text-sm">{account.name}</span>
                                                <span className="font-semibold text-sm">
                                                    {formatCurrency(Number(account.balance))}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>

                            <div className="border-t border-border pt-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-sm font-semibold text-red-500">Liabilities</h4>
                                    <p className="text-sm font-bold text-red-500">
                                        {formatCurrency(data.totalLiabilities)}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    {data.accountBalances
                                        .filter(a => a.type === 'liability')
                                        .map(account => (
                                            <div
                                                key={account.id}
                                                className="flex justify-between items-center p-3 bg-red-50/50 rounded-xl"
                                            >
                                                <span className="text-sm">{account.name}</span>
                                                <span className="font-semibold text-sm text-red-500">
                                                    {formatCurrency(Number(account.balance))}
                                                </span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Recent Transactions — now uses shared component */}
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <Link href="/transactions" className="text-xs text-primary font-semibold hover:underline">
                            View All
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {data.recentTransactions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-4">
                                    <ArrowUpRight className="w-7 h-7 text-muted-foreground" />
                                </div>
                                <p className="font-semibold text-foreground">No transactions yet</p>
                                <p className="text-sm text-muted-foreground mt-1 mb-4">Add your first transaction to get started.</p>
                                <Link
                                    href="/transactions"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Transaction
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {data.recentTransactions.map(transaction => (
                                    <TransactionListItem key={transaction.id} transaction={transaction} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
