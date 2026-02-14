'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, FileText, Eye, Trash2, ArrowRightLeft, FileEdit } from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface InvoiceListItem {
    id: string
    document_type: 'quotation' | 'invoice'
    document_number: string
    date: string
    subtotal: number
    discount: number
    tax_rate: number
    shipping: number
    advance_paid: number
    status: string
    client: { id: string; name: string } | null
}

const statusConfig: Record<string, { label: string; className: string }> = {
    draft: { label: 'Draft', className: 'bg-gray-100 text-gray-600' },
    sent: { label: 'Sent', className: 'bg-blue-50 text-blue-600' },
    accepted: { label: 'Accepted', className: 'bg-emerald-50 text-emerald-600' },
    expired: { label: 'Expired', className: 'bg-red-50 text-red-500' },
    paid: { label: 'Paid', className: 'bg-emerald-50 text-emerald-700' },
}

function getBalance(inv: InvoiceListItem) {
    const subtotalLessDiscount = inv.subtotal - inv.discount
    const tax = subtotalLessDiscount * (inv.tax_rate / 100)
    return subtotalLessDiscount + tax + inv.shipping - inv.advance_paid
}

export default function InvoicesPage() {
    const [tab, setTab] = useState<'quotation' | 'invoice'>('invoice')
    const [invoices, setInvoices] = useState<InvoiceListItem[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)
        fetch(`/api/invoices?type=${tab}`)
            .then(res => res.json())
            .then(json => {
                setInvoices(json.data || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [tab])

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this?')) return
        await fetch(`/api/invoices/${id}`, { method: 'DELETE' })
        setInvoices(prev => prev.filter(i => i.id !== id))
    }

    const handleConvert = async (id: string) => {
        if (!window.confirm('Convert this quotation to an invoice?')) return
        const res = await fetch(`/api/invoices/${id}/convert`, { method: 'POST' })
        if (res.ok) {
            // Mark quotation as accepted in the UI
            setInvoices(prev => prev.map(i =>
                i.id === id ? { ...i, status: 'accepted' } : i
            ))
            // Switch to invoices tab to show the new invoice
            setTab('invoice')
        }
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground mb-1">Invoices</h1>
                    <p className="text-muted-foreground text-sm">
                        Manage your quotations and invoices.
                    </p>
                </div>
                <Link
                    href={`/invoices/create?type=${tab}`}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Create {tab === 'quotation' ? 'Quotation' : 'Invoice'}
                </Link>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-secondary rounded-xl p-1 w-fit">
                <button
                    onClick={() => setTab('invoice')}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'invoice'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Invoices
                </button>
                <button
                    onClick={() => setTab('quotation')}
                    className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'quotation'
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground'
                        }`}
                >
                    Quotations
                </button>
            </div>

            {/* Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-secondary/50">
                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Client</th>
                            <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Balance</th>
                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                            <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12 text-muted-foreground">
                                    Loading...
                                </td>
                            </tr>
                        ) : invoices.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="text-center py-12">
                                    <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                    <p className="font-semibold text-foreground">No {tab === 'quotation' ? 'quotations' : 'invoices'} yet</p>
                                    <p className="text-sm text-muted-foreground mt-1">Create your first one to get started.</p>
                                </td>
                            </tr>
                        ) : (
                            invoices.map(inv => {
                                const balance = getBalance(inv)
                                // If balance is 0 (or less) and not draft, show as Paid
                                const isPaid = balance <= 0 && inv.status !== 'draft'
                                const displayStatus = isPaid ? 'paid' : inv.status
                                const config = statusConfig[displayStatus] || statusConfig.draft

                                return (
                                    <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                                        <td className="px-6 py-4 text-sm font-semibold">{inv.document_number}</td>
                                        <td className="px-6 py-4 text-sm text-muted-foreground">{formatDate(inv.date)}</td>
                                        <td className="px-6 py-4 text-sm">{inv.client?.name || '—'}</td>
                                        <td className="px-6 py-4 text-sm font-bold text-right">{formatCurrency(balance)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${config.className}`}>
                                                {config.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/invoices/${inv.id}`}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
                                                    title="View"
                                                >
                                                    <Eye className="w-4 h-4 text-muted-foreground" />
                                                </Link>
                                                <Link
                                                    href={`/invoices/${inv.id}/edit`}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 transition-colors"
                                                    title="Edit"
                                                >
                                                    <FileEdit className="w-4 h-4 text-blue-500" />
                                                </Link>
                                                {tab === 'quotation' && inv.status !== 'accepted' && (
                                                    <button
                                                        onClick={() => handleConvert(inv.id)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 transition-colors"
                                                        title="Convert to Invoice"
                                                    >
                                                        <ArrowRightLeft className="w-4 h-4 text-blue-500" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(inv.id)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-400" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
