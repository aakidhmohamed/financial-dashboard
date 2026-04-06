'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, AlertTriangle } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

const paymentFormSchema = z.object({
    amount: z.number().positive('Amount must be greater than 0'),
    date: z.string(),
    notes: z.string().optional(),
})

type PaymentFormData = z.infer<typeof paymentFormSchema>

interface LoanPaymentFormProps {
    onClose: () => void
    onSuccess?: () => void
    loanId: string
    lenderName: string
    remainingBalance: number
    direction?: 'borrowed' | 'lent'
}

export function LoanPaymentForm({
    onClose,
    onSuccess,
    loanId,
    lenderName,
    remainingBalance,
    direction = 'borrowed',
}: LoanPaymentFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const isBorrowed = direction === 'borrowed'

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm<PaymentFormData>({
        resolver: zodResolver(paymentFormSchema),
        defaultValues: {
            date: new Date().toISOString().split('T')[0],
            amount: 0,
        },
    })

    const watchAmount = watch('amount')
    const exceedsBalance = watchAmount > remainingBalance

    const onSubmit = async (data: PaymentFormData) => {
        if (data.amount > remainingBalance) {
            setError(`Amount exceeds remaining balance of ${formatCurrency(remainingBalance)}`)
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            const res = await fetch(`/api/loans/${loanId}/payments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    notes: data.notes || null,
                }),
            })

            if (!res.ok) {
                const errData = await res.json()
                throw new Error(errData.error || 'Failed to record payment')
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
            <div className="bg-card rounded-2xl border border-border p-6 w-full max-w-md shadow-xl">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-extrabold">
                        {isBorrowed ? 'Record Payment' : 'Record Receipt'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 bg-secondary rounded-xl flex items-center justify-center hover:bg-muted transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Loan Info */}
                <div className="mb-5 p-3 bg-secondary/50 rounded-xl">
                    <p className="text-sm text-muted-foreground">
                        {isBorrowed ? 'Paying to' : 'Receiving from'}
                    </p>
                    <p className="text-sm font-semibold">{lenderName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Remaining: <span className="font-semibold text-foreground">{formatCurrency(remainingBalance)}</span>
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1.5">
                            {isBorrowed ? 'Payment Amount (LKR)' : 'Receipt Amount (LKR)'}
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            {...register('amount', { valueAsNumber: true })}
                            className={cn(inputClasses, exceedsBalance && 'border-amber-400 focus:ring-amber-200')}
                            placeholder="0.00"
                        />
                        {errors.amount && (
                            <p className="text-xs text-red-500 mt-1">{errors.amount.message}</p>
                        )}
                        {exceedsBalance && (
                            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-amber-600">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                <span>Amount exceeds remaining balance</span>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Date</label>
                        <input type="date" {...register('date')} className={inputClasses} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1.5">Notes (Optional)</label>
                        <textarea
                            {...register('notes')}
                            rows={2}
                            className={cn(inputClasses, 'resize-none')}
                            placeholder="Payment reference, method, etc."
                        />
                    </div>

                    {remainingBalance > 0 && (
                        <button
                            type="button"
                            onClick={() => {
                                const amountInput = document.querySelector<HTMLInputElement>('input[name="amount"]')
                                if (amountInput) {
                                    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
                                        window.HTMLInputElement.prototype, 'value'
                                    )?.set
                                    nativeInputValueSetter?.call(amountInput, remainingBalance.toString())
                                    amountInput.dispatchEvent(new Event('input', { bubbles: true }))
                                }
                            }}
                            className="w-full px-3 py-2 text-xs font-medium text-primary bg-primary/5 border border-primary/20 rounded-xl hover:bg-primary/10 transition-colors"
                        >
                            {isBorrowed ? 'Pay' : 'Receive'} Full Remaining: {formatCurrency(remainingBalance)}
                        </button>
                    )}

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
                            disabled={isSubmitting || exceedsBalance}
                            className="flex-1 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                        >
                            {isSubmitting ? 'Recording...' : isBorrowed ? 'Record Payment' : 'Record Receipt'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
