'use client'

import { useState, useMemo } from 'react'
import {
    Plus,
    Landmark,
    CircleDollarSign,
    CheckCircle2,
    Clock,
    ChevronDown,
    ChevronUp,
    CreditCard,
    User,
    HandCoins,
    ArrowDownLeft,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { LoanForm } from '@/components/forms/loan-form'
import { LoanPaymentForm } from '@/components/forms/loan-payment-form'
import { formatCurrency, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { LoanWithPayments, LoanSummary, Account } from '@/lib/types'

interface LoansClientProps {
    initialLoans: LoanWithPayments[]
    initialSummary: LoanSummary
    accounts: Account[]
}

export function LoansClient({
    initialLoans,
    initialSummary,
    accounts,
}: LoansClientProps) {
    const [showLoanForm, setShowLoanForm] = useState(false)
    const [payingLoan, setPayingLoan] = useState<LoanWithPayments | null>(null)
    const [loans, setLoans] = useState<LoanWithPayments[]>(initialLoans)
    const [summary, setSummary] = useState<LoanSummary>(initialSummary)
    const [expandedLoanId, setExpandedLoanId] = useState<string | null>(null)
    const [collapsedLenders, setCollapsedLenders] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(false)
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'paid'>('all')
    const [directionTab, setDirectionTab] = useState<'borrowed' | 'lent'>('borrowed')

    const loadData = async () => {
        setLoading(true)
        try {
            const loansRes = await fetch('/api/loans')
            if (loansRes.ok) {
                const loansData = await loansRes.json()
                const freshData = (loansData.data || []) as LoanWithPayments[]
                setLoans(freshData)

                // Recalculate summary
                const calcDir = (dir: 'borrowed' | 'lent') => {
                    const subset = freshData.filter(l => l.direction === dir)
                    return {
                        totalOutstanding: subset.filter(l => l.status === 'active').reduce((s, l) => s + Number(l.remaining_balance), 0),
                        totalPrincipal: subset.reduce((s, l) => s + Number(l.amount), 0),
                        activeCount: subset.filter(l => l.status === 'active').length,
                        paidCount: subset.filter(l => l.status === 'paid').length,
                    }
                }
                const borrowed = calcDir('borrowed')
                const lent = calcDir('lent')
                setSummary({
                    totalOutstanding: borrowed.totalOutstanding + lent.totalOutstanding,
                    totalPrincipal: borrowed.totalPrincipal + lent.totalPrincipal,
                    activeCount: borrowed.activeCount + lent.activeCount,
                    paidCount: borrowed.paidCount + lent.paidCount,
                    borrowed,
                    lent,
                })
            }
        } catch (error) {
            console.error('Failed to reload loans:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredLoans = useMemo(() => {
        return loans.filter(loan => {
            if (loan.direction !== directionTab) return false
            if (statusFilter === 'active') return loan.status === 'active'
            if (statusFilter === 'paid') return loan.status === 'paid'
            return true
        })
    }, [loans, directionTab, statusFilter])

    // Group loans by person
    const lenderGroups = useMemo(() => {
        return filteredLoans.reduce<Record<string, LoanWithPayments[]>>((groups, loan) => {
            const name = loan.person_name.trim()
            if (!groups[name]) groups[name] = []
            groups[name].push(loan)
            return groups
        }, {})
    }, [filteredLoans])

    const sortedLenders = Object.keys(lenderGroups).sort()

    const toggleLender = (name: string) => {
        setCollapsedLenders(prev => {
            const next = new Set(prev)
            if (next.has(name)) next.delete(name)
            else next.add(name)
            return next
        })
    }

    const statusConfig = {
        active: { label: 'Active', style: 'bg-amber-50 text-amber-700 border-amber-200' },
        paid: { label: 'Paid', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        defaulted: { label: 'Defaulted', style: 'bg-red-50 text-red-700 border-red-200' },
    }

    const dirSummary = directionTab === 'borrowed' ? summary.borrowed : summary.lent
    const isBorrowed = directionTab === 'borrowed'

    return (
        <div className="p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground mb-1">Loans</h1>
                    <p className="text-muted-foreground text-sm">
                        Track borrowed money and loans given.
                    </p>
                </div>
                <button
                    onClick={() => setShowLoanForm(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Loan
                </button>
            </div>

            {/* Direction Tabs */}
            <div className="flex gap-1 bg-secondary rounded-xl p-1">
                <button
                    onClick={() => { setDirectionTab('borrowed'); setStatusFilter('all') }}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                        isBorrowed
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <ArrowDownLeft className="w-4 h-4" />
                    Borrowed
                    {summary.borrowed.activeCount > 0 && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-bold">
                            {summary.borrowed.activeCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => { setDirectionTab('lent'); setStatusFilter('all') }}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all',
                        !isBorrowed
                            ? 'bg-card text-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground'
                    )}
                >
                    <HandCoins className="w-4 h-4" />
                    Lent Out
                    {summary.lent.activeCount > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold">
                            {summary.lent.activeCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-2xl border border-border p-5 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-muted-foreground">
                            {isBorrowed ? 'I Owe' : 'Owed to Me'}
                        </p>
                        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center', isBorrowed ? 'bg-amber-50' : 'bg-blue-50')}>
                            <CircleDollarSign className={cn('w-4 h-4', isBorrowed ? 'text-amber-600' : 'text-blue-600')} />
                        </div>
                    </div>
                    <p className="text-2xl font-extrabold text-foreground">{formatCurrency(dirSummary.totalOutstanding)}</p>
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-muted-foreground">
                            {isBorrowed ? 'Total Borrowed' : 'Total Lent'}
                        </p>
                        <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                            <Landmark className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>
                    <p className="text-2xl font-extrabold text-foreground">{formatCurrency(dirSummary.totalPrincipal)}</p>
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-muted-foreground">Active</p>
                        <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-orange-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-extrabold text-foreground">{dirSummary.activeCount}</p>
                </div>

                <div className="bg-card rounded-2xl border border-border p-5 transition-all hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-muted-foreground">Fully Paid</p>
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        </div>
                    </div>
                    <p className="text-2xl font-extrabold text-foreground">{dirSummary.paidCount}</p>
                </div>
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
                {(['all', 'active', 'paid'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setStatusFilter(tab)}
                        className={cn(
                            'px-4 py-2 rounded-xl text-sm font-medium transition-all capitalize',
                            statusFilter === tab
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-secondary text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {tab === 'all' ? 'All' : tab}
                    </button>
                ))}
            </div>

            {/* Loans Grouped by Person */}
            {loading && loans.length === 0 ? (
                <Card>
                    <CardContent className="p-6">
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                                    <div className="w-10 h-10 bg-muted rounded-xl" />
                                    <div className="flex-1">
                                        <div className="h-4 w-32 bg-muted rounded mb-2" />
                                        <div className="h-3 w-48 bg-muted rounded" />
                                    </div>
                                    <div className="h-6 w-20 bg-muted rounded-full" />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            ) : filteredLoans.length === 0 ? (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-4">
                                {isBorrowed ? (
                                    <Landmark className="w-7 h-7 text-muted-foreground" />
                                ) : (
                                    <HandCoins className="w-7 h-7 text-muted-foreground" />
                                )}
                            </div>
                            <p className="font-semibold text-foreground">
                                {isBorrowed ? 'No borrowed loans' : 'No loans given'}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1 mb-4">
                                {statusFilter === 'all'
                                    ? isBorrowed
                                        ? 'Record money you borrowed to start tracking.'
                                        : 'Record money you lent to start tracking.'
                                    : `No ${statusFilter} loans yet.`}
                            </p>
                            {statusFilter === 'all' && (
                                <button
                                    onClick={() => setShowLoanForm(true)}
                                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Loan
                                </button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {sortedLenders.map(personName => {
                        const personLoans = lenderGroups[personName]
                        const isCollapsed = collapsedLenders.has(personName)
                        const personOutstanding = personLoans
                            .filter(l => l.status === 'active')
                            .reduce((sum, l) => sum + Number(l.remaining_balance), 0)
                        const personActiveCount = personLoans.filter(l => l.status === 'active').length
                        const personPaidCount = personLoans.filter(l => l.status === 'paid').length

                        return (
                            <Card key={personName}>
                                {/* Person Header */}
                                <button
                                    onClick={() => toggleLender(personName)}
                                    className="w-full flex items-center gap-4 p-5 hover:bg-secondary/30 transition-colors rounded-t-2xl"
                                >
                                    <div className={cn(
                                        'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
                                        isBorrowed ? 'bg-amber-50' : 'bg-blue-50'
                                    )}>
                                        <User className={cn('w-5 h-5', isBorrowed ? 'text-amber-600' : 'text-blue-600')} />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="text-base font-bold text-foreground">{personName}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            {personLoans.length} loan{personLoans.length > 1 ? 's' : ''}
                                            {personActiveCount > 0 && <span> • {personActiveCount} active</span>}
                                            {personPaidCount > 0 && <span> • {personPaidCount} paid</span>}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0 mr-2">
                                        <p className="text-lg font-extrabold text-foreground">
                                            {formatCurrency(personOutstanding)}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {isBorrowed ? 'outstanding' : 'receivable'}
                                        </p>
                                    </div>
                                    {isCollapsed ? (
                                        <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    ) : (
                                        <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                                    )}
                                </button>

                                {/* Person's Loans */}
                                {!isCollapsed && (
                                    <CardContent className="pt-0 pb-3 px-3">
                                        <div className="space-y-1.5">
                                            {personLoans
                                                .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime())
                                                .map(loan => {
                                                    const isExpanded = expandedLoanId === loan.id
                                                    const payments = loan.loan_payments || []
                                                    const totalPaid = Number(loan.amount) - Number(loan.remaining_balance)
                                                    const progressPct = (totalPaid / Number(loan.amount)) * 100
                                                    const config = statusConfig[loan.status]

                                                    return (
                                                        <div
                                                            key={loan.id}
                                                            className="border border-border rounded-xl overflow-hidden transition-all hover:shadow-sm"
                                                        >
                                                            <div className="flex items-center gap-3 p-3">
                                                                <div className={cn(
                                                                    'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                                                                    isBorrowed ? 'bg-amber-50' : 'bg-blue-50'
                                                                )}>
                                                                    <Landmark className={cn('w-4 h-4', isBorrowed ? 'text-amber-600' : 'text-blue-600')} />
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-center gap-2 mb-0.5">
                                                                        <p className="text-sm font-medium">
                                                                            {formatCurrency(Number(loan.amount))}
                                                                        </p>
                                                                        <span className={cn(
                                                                            'text-[10px] font-semibold px-2 py-0.5 rounded-full border',
                                                                            config.style
                                                                        )}>
                                                                            {config.label}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {formatDate(loan.start_date)}
                                                                        {loan.notes && !loan.notes.startsWith('Migrated') && ` • ${loan.notes}`}
                                                                    </p>
                                                                    <div className="mt-1.5 flex items-center gap-2">
                                                                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                                            <div
                                                                                className={cn(
                                                                                    'h-full rounded-full transition-all',
                                                                                    loan.status === 'paid' ? 'bg-emerald-500' : isBorrowed ? 'bg-amber-500' : 'bg-blue-500'
                                                                                )}
                                                                                style={{ width: `${Math.min(progressPct, 100)}%` }}
                                                                            />
                                                                        </div>
                                                                        <span className="text-[10px] text-muted-foreground font-medium w-10 text-right">
                                                                            {progressPct.toFixed(0)}%
                                                                        </span>
                                                                    </div>
                                                                </div>

                                                                <div className="text-right flex-shrink-0">
                                                                    <p className="text-sm font-bold text-foreground">
                                                                        {formatCurrency(Number(loan.remaining_balance))}
                                                                    </p>
                                                                    <p className="text-[10px] text-muted-foreground">remaining</p>
                                                                </div>

                                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                                    {loan.status === 'active' && (
                                                                        <button
                                                                            onClick={() => setPayingLoan(loan)}
                                                                            className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                                                            title={isBorrowed ? 'Record Payment' : 'Record Receipt'}
                                                                        >
                                                                            <CreditCard className="w-4 h-4" />
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        onClick={() => setExpandedLoanId(isExpanded ? null : loan.id)}
                                                                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                                                                    >
                                                                        {isExpanded ? (
                                                                            <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                                                        ) : (
                                                                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                                        )}
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {isExpanded && (
                                                                <div className="border-t border-border bg-secondary/30 px-4 py-3">
                                                                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">
                                                                        {isBorrowed ? 'Payment History' : 'Receipt History'} ({payments.length})
                                                                    </p>
                                                                    {payments.length === 0 ? (
                                                                        <p className="text-xs text-muted-foreground py-2">
                                                                            {isBorrowed ? 'No payments recorded yet.' : 'No receipts recorded yet.'}
                                                                        </p>
                                                                    ) : (
                                                                        <div className="space-y-1.5">
                                                                            {payments
                                                                                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                                                                .map(payment => (
                                                                                    <div
                                                                                        key={payment.id}
                                                                                        className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-secondary/50"
                                                                                    >
                                                                                        <div className="flex items-center gap-2">
                                                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                                                            <span className="text-xs text-muted-foreground">{formatDate(payment.date)}</span>
                                                                                            {payment.notes && (
                                                                                                <span className="text-xs text-muted-foreground">• {payment.notes}</span>
                                                                                            )}
                                                                                        </div>
                                                                                        <span className="text-xs font-semibold text-emerald-600">
                                                                                            -{formatCurrency(Number(payment.amount))}
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                        </div>
                                    </CardContent>
                                )}
                            </Card>
                        )
                    })}
                </div>
            )}

            {/* Loan Form Modal */}
            {showLoanForm && (
                <LoanForm
                    onClose={() => setShowLoanForm(false)}
                    onSuccess={() => loadData()}
                    accounts={accounts}
                    defaultDirection={directionTab}
                />
            )}

            {/* Payment Form Modal */}
            {payingLoan && (
                <LoanPaymentForm
                    onClose={() => setPayingLoan(null)}
                    onSuccess={() => loadData()}
                    loanId={payingLoan.id}
                    lenderName={payingLoan.person_name}
                    remainingBalance={Number(payingLoan.remaining_balance)}
                    direction={payingLoan.direction}
                />
            )}
        </div>
    )
}
