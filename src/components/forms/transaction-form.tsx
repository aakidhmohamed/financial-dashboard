'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, ArrowRightLeft } from 'lucide-react' // Added icon for Loan if needed, or reuse
import { cn } from '@/lib/utils'
import type { Account } from '@/lib/types'

const transactionSchema = z.object({
    date: z.string(),
    type: z.enum(['revenue', 'expense', 'capital', 'transfer', 'loan']),
    category_id: z.string().uuid('Please select a category'),
    amount: z.number().positive('Amount must be greater than 0'),
    description: z.string().optional(),
    client_id: z.string().uuid().optional().or(z.literal('')),
    supplier_id: z.string().uuid().optional().or(z.literal('')),
    account_id: z.string().uuid('Please select an account'),
    to_account_id: z.string().uuid().optional().or(z.literal('')),
}).refine(data => {
    if ((data.type === 'transfer' || data.type === 'loan') && !data.to_account_id) {
        return false
    }
    return true
}, {
    message: 'Please select the second account',
    path: ['to_account_id'],
}).refine(data => {
    if ((data.type === 'transfer' || data.type === 'loan') && data.account_id === data.to_account_id) {
        return false
    }
    return true
}, {
    message: 'Source and destination accounts must be different',
    path: ['to_account_id'],
})

type TransactionFormData = z.infer<typeof transactionSchema>

interface TransactionFormProps {
    onClose: () => void
    onSuccess?: () => void
    categories: Array<{ id: string; name: string; type: string }>
    accounts: Account[]
    clients?: Array<{ id: string; name: string }>
    suppliers?: Array<{ id: string; name: string }>
}

export function TransactionForm({
    onClose,
    onSuccess,
    categories,
    accounts,
    clients = [],
    suppliers = [],
}: TransactionFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<TransactionFormData>({
        resolver: zodResolver(transactionSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            type: 'revenue',
            amount: 0,
        },
    })

    const transactionType = watch('type')
    const selectedAccountId = watch('account_id')
    const filteredCategories = categories.filter(c => c.type === transactionType)

    const onSubmit = async (data: TransactionFormData) => {
        setIsSubmitting(true)
        setError(null)

        try {
            const payload = {
                ...data,
                client_id: data.client_id || null,
                supplier_id: data.supplier_id || null,
                description: data.description || null,
                // For Transfer: account_id = Source, to_account_id = Dest
                // For Loan: account_id = Asset (Deposit To), to_account_id = Liability (Loan From)
                to_account_id: (data.type === 'transfer' || data.type === 'loan') ? (data.to_account_id || null) : null,
            }

            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Failed to create transaction')
            }

            router.refresh()
            onSuccess?.()
            onClose()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    const inputClasses = 'w-full px-4 py-2.5 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-muted-foreground transition-all'

    const typeConfig = {
        revenue: { label: 'Revenue', activeClass: 'border-primary bg-emerald-50 text-primary', hoverClass: 'hover:border-primary/40' },
        expense: { label: 'Expense', activeClass: 'border-red-500 bg-red-50 text-red-500', hoverClass: 'hover:border-red-300' },
        capital: { label: 'Capital', activeClass: 'border-blue-500 bg-blue-50 text-blue-600', hoverClass: 'hover:border-blue-300' },
        transfer: { label: 'Transfer', activeClass: 'border-purple-500 bg-purple-50 text-purple-600', hoverClass: 'hover:border-purple-300' },
        loan: { label: 'Loan', activeClass: 'border-amber-500 bg-amber-50 text-amber-700', hoverClass: 'hover:border-amber-300' },
    }

    const isTransfer = transactionType === 'transfer'
    const isLoan = transactionType === 'loan'

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-extrabold">Add Transaction</h2>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {/* Date */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Date</label>
                        <input
                            type="date"
                            {...register('date')}
                            className={inputClasses}
                        />
                        {errors.date && (
                            <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>
                        )}
                    </div>

                    {/* Type - 5 options */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Type</label>
                        <div className="grid grid-cols-5 gap-2">
                            {(['revenue', 'expense', 'capital', 'transfer', 'loan'] as const).map(type => (
                                <label
                                    key={type}
                                    className={cn(
                                        'px-1 py-2.5 border rounded-xl cursor-pointer transition-all text-[11px] sm:text-xs font-semibold text-center flex items-center justify-center',
                                        transactionType === type
                                            ? typeConfig[type].activeClass
                                            : `border-border ${typeConfig[type].hoverClass}`
                                    )}
                                >
                                    <input type="radio" value={type} {...register('type')} className="sr-only" />
                                    {typeConfig[type].label}
                                </label>
                            ))}
                        </div>
                        {isTransfer && (
                            <p className="text-xs text-purple-600 mt-2">
                                Moves funds between accounts. No P&L impact.
                            </p>
                        )}
                        {transactionType === 'capital' && (
                            <p className="text-xs text-blue-600 mt-2">
                                Capital adds funds to your account (Equity).
                            </p>
                        )}
                        {isLoan && (
                            <p className="text-xs text-amber-700 mt-2">
                                Record a loan taken. Increases Cash (Asset) and Debt (Liability).
                            </p>
                        )}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Category</label>
                        <select {...register('category_id')} className={inputClasses}>
                            <option value="">Select category</option>
                            {filteredCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        {errors.category_id && (
                            <p className="text-xs text-red-500 mt-1">{errors.category_id.message}</p>
                        )}
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Amount (LKR)</label>
                        <input
                            type="number"
                            step="0.01"
                            {...register('amount', { valueAsNumber: true })}
                            className={inputClasses}
                            placeholder="0.00"
                        />
                        {errors.amount && (
                            <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>
                        )}
                    </div>

                    {/* Account Fields based on Type */}

                    {/* Case 1: Standard (Revenue/Expense/Capital) */}
                    {!isTransfer && !isLoan && (
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Account</label>
                            <select {...register('account_id')} className={inputClasses}>
                                <option value="">Select account</option>
                                {accounts.map(acc => (
                                    <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                            </select>
                            {errors.account_id && (
                                <p className="text-xs text-red-500 mt-1">{errors.account_id.message}</p>
                            )}
                        </div>
                    )}

                    {/* Case 2: Transfer */}
                    {isTransfer && (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">From Account</label>
                                <select {...register('account_id')} className={inputClasses}>
                                    <option value="">Select source account</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                                {errors.account_id && (
                                    <p className="text-xs text-red-500 mt-1">{errors.account_id.message}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">To Account</label>
                                <select {...register('to_account_id')} className={inputClasses}>
                                    <option value="">Select destination account</option>
                                    {accounts
                                        .filter(acc => acc.id !== selectedAccountId)
                                        .map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                </select>
                                {errors.to_account_id && (
                                    <p className="text-xs text-red-500 mt-1">{errors.to_account_id.message}</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Case 3: Loan */}
                    {isLoan && (
                        <>
                            {/* Deposit To (Asset) */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Deposit To (Asset)</label>
                                <select {...register('account_id')} className={inputClasses}>
                                    <option value="">Select receiving account</option>
                                    {accounts
                                        .filter(acc => acc.type === 'asset')
                                        .map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                </select>
                                {errors.account_id && (
                                    <p className="text-xs text-red-500 mt-1">{errors.account_id.message}</p>
                                )}
                            </div>

                            {/* Loan From (Liability) */}
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Loan From (Liability)</label>
                                <select {...register('to_account_id')} className={inputClasses}>
                                    <option value="">Select liability account</option>
                                    {accounts
                                        .filter(acc => acc.type === 'liability')
                                        .map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                </select>
                                {errors.to_account_id && ( // Reusing to_account_id for the Liability/Source
                                    <p className="text-xs text-red-500 mt-1">{errors.to_account_id.message}</p>
                                )}
                            </div>
                        </>
                    )}

                    {/* Client (Revenue only) */}
                    {transactionType === 'revenue' && clients.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Client (Optional)</label>
                            <select {...register('client_id')} className={inputClasses}>
                                <option value="">Select client</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Supplier (Expense only) */}
                    {transactionType === 'expense' && suppliers.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Supplier (Optional)</label>
                            <select {...register('supplier_id')} className={inputClasses}>
                                <option value="">Select supplier</option>
                                {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Description (Optional)</label>
                        <textarea
                            {...register('description')}
                            rows={3}
                            className={cn(inputClasses, 'resize-none')}
                            placeholder="Add notes about this transaction..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-border rounded-xl text-sm font-medium hover:bg-secondary transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isSubmitting ? 'Adding...' : 'Add Transaction'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
