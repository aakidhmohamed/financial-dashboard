'use client'

import { TrendingUp, TrendingDown, Landmark, ArrowLeftRight } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import type { TransactionWithRelations } from '@/lib/types'

interface TransactionListItemProps {
    transaction: TransactionWithRelations
}

export function TransactionListItem({ transaction }: TransactionListItemProps) {
    const isRevenue = transaction.type === 'revenue'
    const isCapital = transaction.type === 'capital'
    const isTransfer = transaction.type === 'transfer'

    const bgColor = isTransfer ? 'bg-purple-50' : isCapital ? 'bg-blue-50' : isRevenue ? 'bg-emerald-50' : 'bg-red-50'
    const textColor = isTransfer ? 'text-purple-600' : isCapital ? 'text-blue-600' : isRevenue ? 'text-emerald-600' : 'text-red-500'
    const prefix = transaction.type === 'expense' ? '-' : isTransfer ? '↔ ' : '+'

    return (
        <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-secondary/50 transition-colors">
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
                <p className="text-sm font-medium truncate">{transaction.category?.name}</p>
                <p className="text-xs text-muted-foreground">
                    {formatDate(transaction.date)} • {transaction.description || 'No description'}
                </p>
            </div>
            <span className={`text-sm font-bold ${textColor}`}>
                {prefix}
                {formatCurrency(Number(transaction.amount))}
            </span>
        </div>
    )
}
