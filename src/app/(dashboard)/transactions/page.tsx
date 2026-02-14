'use client'

import { useState, useEffect } from 'react'
import { Plus, TrendingUp, TrendingDown, Landmark, ArrowLeftRight } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { TransactionForm } from '@/components/forms/transaction-form'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { TransactionWithRelations, Category, Account } from '@/lib/types'

export default function TransactionsPage() {
    const [showForm, setShowForm] = useState(false)
    const [transactions, setTransactions] = useState<TransactionWithRelations[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [txRes, catRes, accRes] = await Promise.all([
                fetch('/api/transactions'),
                fetch('/api/categories'),
                fetch('/api/accounts'),
            ])

            const txData = await txRes.json()
            setTransactions(txData.data || [])
            setCategories(await catRes.json())
            setAccounts(await accRes.json())
        } catch (error) {
            console.error('Failed to load data:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground mb-1">Transactions</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage your revenue and expenses.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Transaction
                </button>
            </div>

            {/* Transactions List */}
            <Card>
                <CardHeader>
                    <CardTitle>All Transactions</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                                    <div className="w-9 h-9 bg-muted rounded-xl" />
                                    <div className="flex-1">
                                        <div className="h-4 w-32 bg-muted rounded mb-1" />
                                        <div className="h-3 w-48 bg-muted rounded" />
                                    </div>
                                    <div className="h-4 w-20 bg-muted rounded" />
                                </div>
                            ))}
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-4">
                                <ArrowLeftRight className="w-7 h-7 text-muted-foreground" />
                            </div>
                            <p className="font-semibold text-foreground">No transactions yet</p>
                            <p className="text-sm text-muted-foreground mt-1 mb-4">Add your first transaction to get started.</p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                            >
                                <Plus className="w-4 h-4" />
                                Add Transaction
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-1">
                            {transactions.map(tx => {
                                const isRevenue = tx.type === 'revenue'
                                const isCapital = tx.type === 'capital'
                                const isTransfer = tx.type === 'transfer'
                                const bgColor = isTransfer ? 'bg-purple-50' : isCapital ? 'bg-blue-50' : isRevenue ? 'bg-emerald-50' : 'bg-red-50'
                                const textColor = isTransfer ? 'text-purple-600' : isCapital ? 'text-blue-600' : isRevenue ? 'text-emerald-600' : 'text-red-500'
                                const prefix = tx.type === 'expense' ? '-' : isTransfer ? '↔ ' : '+'
                                return (
                                    <div
                                        key={tx.id}
                                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors"
                                    >
                                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${bgColor}`}>
                                            {isTransfer ? (
                                                <ArrowLeftRight className={`w-4 h-4 ${textColor}`} />
                                            ) : isCapital ? (
                                                <Landmark className={`w-4 h-4 ${textColor}`} />
                                            ) : isRevenue ? (
                                                <TrendingUp className={`w-4 h-4 ${textColor}`} />
                                            ) : (
                                                <TrendingDown className={`w-4 h-4 ${textColor}`} />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{tx.category?.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatDate(tx.date)} • {tx.description || 'No description'}
                                            </p>
                                        </div>
                                        <span className={`text-sm font-bold ${textColor}`}>
                                            {prefix}
                                            {formatCurrency(Number(tx.amount))}
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Transaction Form Modal */}
            {showForm && (
                <TransactionForm
                    onClose={() => setShowForm(false)}
                    onSuccess={() => loadData()}
                    categories={categories}
                    accounts={accounts}
                />
            )}
        </div>
    )
}
