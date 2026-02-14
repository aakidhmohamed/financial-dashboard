'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Plus, Trash2, ArrowLeft, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface LineItem {
    description: string
    quantity: number
    unit_price: number
}

interface ClientOption {
    id: string
    name: string
    address: string | null
    phone: string | null
}

interface Account {
    id: string
    name: string
    type: string
    balance: number
}

function CreateInvoiceContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const docType = (searchParams.get('type') as 'quotation' | 'invoice') || 'invoice'

    const [documentNumber, setDocumentNumber] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [clientId, setClientId] = useState('')
    const [clients, setClients] = useState<ClientOption[]>([])
    const [accounts, setAccounts] = useState<Account[]>([])
    const [paymentAccountId, setPaymentAccountId] = useState('')
    const [discount, setDiscount] = useState(0)
    const [taxRate, setTaxRate] = useState(0)
    const [shipping, setShipping] = useState(0)
    const [advancePaid, setAdvancePaid] = useState(0)
    const [remarks, setRemarks] = useState(
        docType === 'invoice'
            ? 'A minimum of 50% advance is required to confirm the order.\nThe remaining balance must be paid on delivery or upon installation.'
            : ''
    )
    const [items, setItems] = useState<LineItem[]>([
        { description: '', quantity: 1, unit_price: 0 },
    ])
    const [submitting, setSubmitting] = useState(false)

    // Fetch next number
    useEffect(() => {
        fetch(`/api/invoices/next-number?type=${docType}`)
            .then(r => r.json())
            .then(d => setDocumentNumber(d.nextNumber || ''))
            .catch(() => { })
    }, [docType])

    // Fetch clients
    useEffect(() => {
        fetch('/api/clients')
            .then(r => r.json())
            .then(d => setClients(Array.isArray(d) ? d : d.data || []))
            .catch(() => { })
    }, [])

    // Fetch accounts
    useEffect(() => {
        fetch('/api/accounts')
            .then(r => r.json())
            .then(d => {
                const accountList = Array.isArray(d) ? d : d.data || []
                setAccounts(accountList)
                // Auto-select Cash or Bank
                if (!paymentAccountId) {
                    const cashAccount = accountList.find((a: Account) => a.name.toLowerCase().includes('cash'))
                    const defaultAccount = cashAccount || accountList[0]
                    if (defaultAccount) setPaymentAccountId(defaultAccount.id)
                }
            })
            .catch(() => { })
    }, [])

    const addItem = () => {
        setItems([...items, { description: '', quantity: 1, unit_price: 0 }])
    }

    const removeItem = (index: number) => {
        if (items.length <= 1) return
        setItems(items.filter((_, i) => i !== index))
    }

    const updateItem = (index: number, field: keyof LineItem, value: string | number) => {
        setItems(items.map((item, i) => {
            if (i !== index) return item
            return { ...item, [field]: value }
        }))
    }

    // Calculations
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)
    const subtotalLessDiscount = subtotal - discount
    const totalTax = subtotalLessDiscount * (taxRate / 100)
    const balance = subtotalLessDiscount + totalTax + shipping - advancePaid

    const handleSubmit = async (e: React.FormEvent | null, statusOverride?: string, advanceOverride?: number) => {
        if (e) e.preventDefault()

        if (!documentNumber) {
            alert('Document number is required')
            return
        }
        if (items.length === 0) {
            alert('At least one line item is required')
            return
        }

        // Validation: Advance/Paid requires account
        const finalAdvance = advanceOverride !== undefined ? advanceOverride : advancePaid
        const finalStatus = statusOverride || 'draft'
        const isPaidStatus = finalStatus === 'paid'

        if ((finalAdvance > 0 || isPaidStatus) && !paymentAccountId) {
            alert('Please select a payment account')
            return
        }

        setSubmitting(true)
        try {
            const body = {
                document_type: docType,
                document_number: documentNumber,
                date,
                client_id: clientId || null,
                discount,
                tax_rate: taxRate,
                shipping,
                payment_account_id: paymentAccountId || null,
                advance_paid: finalAdvance,
                remarks: remarks || null,
                status: finalStatus,
                items: items.filter(i => i.description.trim()),
            }

            const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })

            if (res.ok) {
                const data = await res.json()
                router.push(`/invoices/${data.id}`)
            } else {
                const errorText = await res.text()
                alert(`Failed to create. Status: ${res.status}. Error: ${errorText}`)
            }
        } catch (err: any) {
            alert(`An error occurred: ${err.message}`)
        } finally {
            setSubmitting(false)
        }
    }


    const inputClasses = "w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
    const labelClasses = "block text-sm font-medium mb-1.5"

    return (
        <div className="p-8 max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/invoices" className="w-10 h-10 flex items-center justify-center rounded-xl bg-secondary hover:bg-muted transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-extrabold text-foreground">
                        Create {docType === 'quotation' ? 'Quotation' : 'Invoice'}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {documentNumber && `Document: ${documentNumber}`}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Top Details */}
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label className="text-sm font-medium">Document Number</label>
                                <div className="flex items-center gap-1 text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-md border border-border">
                                    <Lock className="w-3 h-3" />
                                    <span>Auto-generated</span>
                                </div>
                            </div>
                            <input
                                type="text"
                                value={documentNumber}
                                readOnly
                                className={`${inputClasses} bg-muted/30 text-muted-foreground cursor-not-allowed`}
                                title="This number is automatically generated and cannot be changed"
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Date</label>
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className={inputClasses}
                                required
                            />
                        </div>
                        <div>
                            <label className={labelClasses}>Client</label>
                            <select
                                value={clientId}
                                onChange={e => setClientId(e.target.value)}
                                className={inputClasses}
                            >
                                <option value="">Select client</option>
                                {clients.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Line Items */}
                <div className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                        <h3 className="font-semibold">Line Items</h3>
                        <button
                            type="button"
                            onClick={addItem}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-all"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add Item
                        </button>
                    </div>
                    <table className="w-full">
                        <thead>
                            <tr className="bg-secondary/50 border-b border-border">
                                <th className="text-left px-6 py-3 text-xs font-semibold text-muted-foreground uppercase w-[45%]">Description</th>
                                <th className="text-center px-4 py-3 text-xs font-semibold text-muted-foreground uppercase w-[12%]">Qty</th>
                                <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase w-[18%]">Unit Price</th>
                                <th className="text-right px-6 py-3 text-xs font-semibold text-muted-foreground uppercase w-[18%]">Total</th>
                                <th className="w-[7%]"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={index} className="border-b border-border last:border-0">
                                    <td className="px-6 py-3">
                                        <input
                                            type="text"
                                            value={item.description}
                                            onChange={e => updateItem(index, 'description', e.target.value)}
                                            placeholder="Item description"
                                            className="w-full px-2 py-1.5 bg-transparent border-0 text-sm focus:outline-none focus:ring-0"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={e => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                            min="1"
                                            className="w-full px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <input
                                            type="number"
                                            value={item.unit_price}
                                            onChange={e => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                            min="0"
                                            step="0.01"
                                            className="w-full px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                                        />
                                    </td>
                                    <td className="px-6 py-3 text-sm font-semibold text-right">
                                        {formatCurrency(item.quantity * item.unit_price)}
                                    </td>
                                    <td className="pr-4 py-3">
                                        <button
                                            type="button"
                                            onClick={() => removeItem(index)}
                                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                                            disabled={items.length <= 1}
                                        >
                                            <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Summary + Remarks */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Remarks */}
                    <div className="bg-card border border-border rounded-2xl p-6">
                        <label className={labelClasses}>Remarks / Payment Instructions</label>
                        <textarea
                            value={remarks}
                            onChange={e => setRemarks(e.target.value)}
                            rows={4}
                            className={inputClasses}
                            placeholder="Add payment instructions or notes..."
                        />
                    </div>

                    {/* Financial Summary */}
                    <div className="bg-card border border-border rounded-2xl p-6 space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subtotal</span>
                            <span className="font-semibold">{formatCurrency(subtotal)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <label className="text-sm text-muted-foreground whitespace-nowrap">Discount</label>
                            <input
                                type="number"
                                value={discount}
                                onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="w-32 px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div className="flex justify-between text-sm border-t border-border pt-3">
                            <span className="text-muted-foreground">Subtotal Less Discount</span>
                            <span className="font-semibold">{formatCurrency(subtotalLessDiscount)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <label className="text-sm text-muted-foreground whitespace-nowrap">Tax Rate (%)</label>
                            <input
                                type="number"
                                value={taxRate}
                                onChange={e => setTaxRate(parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="w-32 px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Tax</span>
                            <span>{formatCurrency(totalTax)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                            <label className="text-sm text-muted-foreground whitespace-nowrap">Shipping / Handling</label>
                            <input
                                type="number"
                                value={shipping}
                                onChange={e => setShipping(parseFloat(e.target.value) || 0)}
                                min="0"
                                step="0.01"
                                className="w-32 px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>
                        <div className="space-y-3 border-t border-border pt-3">
                            <div>
                                <label className="text-sm font-medium mb-1.5 block">Payment Account</label>
                                <select
                                    value={paymentAccountId}
                                    onChange={e => setPaymentAccountId(e.target.value)}
                                    className="w-full px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                    <option value="">Select account...</option>
                                    {accounts.map(a => (
                                        <option key={a.id} value={a.id}>
                                            {a.name} ({formatCurrency(a.balance)})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                                <label className="text-sm text-muted-foreground whitespace-nowrap">Advance Paid</label>
                                <input
                                    type="number"
                                    value={advancePaid}
                                    onChange={e => setAdvancePaid(parseFloat(e.target.value) || 0)}
                                    min="0"
                                    step="0.01"
                                    className="w-32 px-2 py-1.5 bg-secondary border border-border rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        </div>
                        <div className="flex justify-between items-center border-t-2 border-foreground pt-3">
                            <span className="font-bold text-lg">
                                {balance <= 0 ? 'STATUS' : 'BALANCE'}
                            </span>
                            <span className={`font-black text-xl ${balance <= 0 ? 'text-green-600' : ''}`}>
                                {balance <= 0 ? 'PAID' : formatCurrency(balance)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3">

                    <button
                        type="button"
                        onClick={() => handleSubmit(null, 'sent')}
                        disabled={submitting || !documentNumber}
                        className="px-8 py-3 bg-secondary text-foreground rounded-xl font-semibold text-sm hover:bg-muted transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save & Send
                    </button>
                    <button
                        type="submit"
                        disabled={submitting || !documentNumber}
                        className="px-8 py-3 bg-primary text-white rounded-xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    // onClick removed to allow native form submission (defaults to draft)
                    >
                        {submitting
                            ? 'Creating...'
                            : `Save as Draft`
                        }
                    </button>
                </div>
            </form>
        </div>
    )
}

export default function CreateInvoicePage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
            <CreateInvoiceContent />
        </Suspense>
    )
}


