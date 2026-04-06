'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Account } from '@/lib/types'

const loanFormSchema = z.object({
    person_name: z.string().min(1, 'Name is required'),
    direction: z.enum(['borrowed', 'lent']),
    amount: z.number().positive('Amount must be greater than 0'),
    start_date: z.string(),
    notes: z.string().optional(),
    account_id: z.string().uuid('Please select an account'),
    liability_account_id: z.string().uuid('Please select an account'),
}).refine(data => data.account_id !== data.liability_account_id, {
    message: 'The two accounts must be different',
    path: ['liability_account_id'],
})

type LoanFormData = z.infer<typeof loanFormSchema>

interface LoanFormProps {
    onClose: () => void
    onSuccess?: () => void
    accounts: Account[]
    defaultDirection?: 'borrowed' | 'lent'
}

export function LoanForm({ onClose, onSuccess, accounts, defaultDirection = 'borrowed' }: LoanFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const assetAccounts = accounts.filter(a => a.type === 'asset')
    const liabilityAccounts = accounts.filter(a => a.type === 'liability')

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<LoanFormData>({
        resolver: zodResolver(loanFormSchema),
        defaultValues: {
            start_date: new Date().toISOString().split('T')[0],
            amount: 0,
            direction: defaultDirection,
        },
    })

    const direction = watch('direction')
    const isBorrowed = direction === 'borrowed'

    const onSubmit = async (data: LoanFormData) => {
        setIsSubmitting(true)
        setError(null)

        try {
            const res = await fetch('/api/loans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    notes: data.notes || null,
                }),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Failed to create loan')
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-foreground/30 backdrop-blur-sm">
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-extrabold">
                        {isBorrowed ? 'Record Borrowed Loan' : 'Record Loan Given'}
                    </h2>
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
                    {/* Direction Toggle */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Type</label>
                        <div className="grid grid-cols-2 gap-2">
                            <label className={cn(
                                'flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer border transition-all',
                                isBorrowed
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-background border-border hover:bg-secondary'
                            )}>
                                <input type="radio" value="borrowed" {...register('direction')} className="sr-only" />
                                I Borrowed
                            </label>
                            <label className={cn(
                                'flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer border transition-all',
                                !isBorrowed
                                    ? 'bg-primary text-white border-primary shadow-sm'
                                    : 'bg-background border-border hover:bg-secondary'
                            )}>
                                <input type="radio" value="lent" {...register('direction')} className="sr-only" />
                                I Lent
                            </label>
                        </div>
                    </div>

                    {/* Person Name */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            {isBorrowed ? 'Lender Name' : 'Borrower Name'}
                        </label>
                        <input
                            type="text"
                            {...register('person_name')}
                            className={inputClasses}
                            placeholder={isBorrowed ? 'Who did you borrow from?' : 'Who did you lend to?'}
                        />
                        {errors.person_name && (
                            <p className="text-xs text-red-500 mt-1">{errors.person_name.message}</p>
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

                    {/* Start Date */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Date</label>
                        <input
                            type="date"
                            {...register('start_date')}
                            className={inputClasses}
                        />
                    </div>

                    {/* Account fields — labels adapt to direction */}
                    {isBorrowed ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Deposit To (Asset Account)</label>
                                <select {...register('account_id')} className={inputClasses}>
                                    <option value="">Select account</option>
                                    {assetAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                                {errors.account_id && (
                                    <p className="text-xs text-red-500 mt-1">{errors.account_id.message}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">Where the borrowed money goes</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Track Under (Liability Account)</label>
                                <select {...register('liability_account_id')} className={inputClasses}>
                                    <option value="">Select liability account</option>
                                    {liabilityAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                                {errors.liability_account_id && (
                                    <p className="text-xs text-red-500 mt-1">{errors.liability_account_id.message}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">Which debt account tracks this loan</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Track Under (Receivable Account)</label>
                                <select {...register('account_id')} className={inputClasses}>
                                    <option value="">Select receivable account</option>
                                    {assetAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                                {errors.account_id && (
                                    <p className="text-xs text-red-500 mt-1">{errors.account_id.message}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">Account that tracks what they owe you</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Paid From (Source Account)</label>
                                <select {...register('liability_account_id')} className={inputClasses}>
                                    <option value="">Select source account</option>
                                    {assetAccounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </select>
                                {errors.liability_account_id && (
                                    <p className="text-xs text-red-500 mt-1">{errors.liability_account_id.message}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-1">Where the money came from (e.g. Cash)</p>
                            </div>
                        </>
                    )}

                    {/* Notes */}
                    <div>
                        <label className="block text-sm font-medium mb-1.5">Notes (Optional)</label>
                        <textarea
                            {...register('notes')}
                            rows={3}
                            className={cn(inputClasses, 'resize-none')}
                            placeholder="Add notes about this loan..."
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
                            {isSubmitting ? 'Creating...' : isBorrowed ? 'Record Borrowing' : 'Record Lending'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
