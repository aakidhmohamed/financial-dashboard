'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Printer, ArrowRightLeft, Download } from 'lucide-react'
import Link from 'next/link'

interface InvoiceData {
    id: string
    document_type: 'quotation' | 'invoice'
    document_number: string
    date: string
    subtotal: number
    discount: number
    tax_rate: number
    shipping: number
    advance_paid: number
    remarks: string | null
    status: string
    quotation_id: string | null
    client: {
        id: string
        name: string
        address: string | null
        phone: string | null
    } | null
    items: {
        id: string
        description: string
        quantity: number
        unit_price: number
        total: number
        sort_order: number
    }[]
}

function fmt(n: number) {
    return n.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`
}

export default function ViewInvoicePage() {
    const params = useParams()
    const router = useRouter()
    const [invoice, setInvoice] = useState<InvoiceData | null>(null)
    const [loading, setLoading] = useState(true)
    const printRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetch(`/api/invoices/${params.id}`)
            .then(r => r.json())
            .then(data => {
                setInvoice(data)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [params.id])

    const handlePrint = () => window.print()

    const handleConvert = async () => {
        if (!invoice || !confirm('Convert this quotation to an invoice?')) return
        const res = await fetch(`/api/invoices/${invoice.id}/convert`, { method: 'POST' })
        if (res.ok) {
            const data = await res.json()
            router.push(`/invoices/${data.id}`)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        )
    }

    if (!invoice) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <p className="text-muted-foreground">Invoice not found</p>
            </div>
        )
    }

    const subtotalLessDiscount = invoice.subtotal - invoice.discount
    const totalTax = subtotalLessDiscount * (invoice.tax_rate / 100)
    const balance = subtotalLessDiscount + totalTax + invoice.shipping - invoice.advance_paid

    // Pad items to show empty rows (like the original template)
    const displayItems = [...invoice.items]
    while (displayItems.length < 10) {
        displayItems.push({ id: `empty-${displayItems.length}`, description: '', quantity: 0, unit_price: 0, total: 0, sort_order: displayItems.length })
    }

    const docTitle = invoice.document_type === 'quotation' ? 'QUOTATION' : 'INVOICE'

    return (
        <div className="min-h-screen bg-slate-50/50 print:bg-white">
            {/* Action bar - hidden when printing */}
            <div className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex items-center gap-4 print:hidden px-8">
                <Link href="/invoices" className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors py-2 px-3 rounded-lg hover:bg-slate-100">
                    <ArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Invoices</span>
                </Link>
                <div className="h-4 w-[1px] bg-slate-200" />
                <div className="flex-1">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-400 block mb-0.5">{docTitle}</span>
                    <h1 className="text-lg font-bold text-slate-900 leading-none">{invoice.document_number}</h1>
                </div>
                <div className="flex items-center gap-2">
                    {invoice.document_type === 'quotation' && invoice.status !== 'accepted' && (
                        <button
                            onClick={handleConvert}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
                        >
                            <ArrowRightLeft className="w-4 h-4" />
                            Convert to Invoice
                        </button>
                    )}
                    <button
                        onClick={handlePrint}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition-all shadow-sm shadow-slate-200"
                    >
                        <Printer className="w-4 h-4" />
                        Print Document
                    </button>
                </div>
            </div>

            {/* Invoice Document */}
            <div ref={printRef} className="max-w-[210mm] mx-auto bg-white print:m-0 print:shadow-none shadow-[0_0_50px_-12px_rgba(0,0,0,0.1)] my-12 print:my-0 rounded-2xl overflow-hidden print:rounded-none">
                {/* Visual Accent Bar */}
                <div className="h-2 bg-slate-900 print:h-1" />

                <div className="p-16 print:p-8 text-slate-900" style={{ fontFamily: "Inter, system-ui, -apple-system, sans-serif" }}>
                    {/* Header */}
                    <div className="flex justify-between items-start mb-16 print:mb-8">
                        <div className="flex flex-col gap-6 print:gap-2">
                            <div className="flex items-center gap-4">
                                <div className="p-2 border border-slate-100 rounded-xl shadow-sm">
                                    <img src="/urthly-logo.png" alt="URTHLY" className="w-16 h-16 object-contain" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black tracking-tight text-slate-900">URTHLY</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">BUILD YOUR BUSINESS</p>
                                </div>
                            </div>
                            <div className="space-y-1 text-sm text-slate-500">
                                <p className="font-medium text-slate-700">122 Kandy Road, Weweldeniya</p>
                                <p>Sri Lanka</p>
                                <div className="pt-2 flex flex-col gap-0.5">
                                    <p className="flex items-center gap-2 font-medium text-slate-600">
                                        <span className="text-[10px] uppercase text-slate-300 font-bold w-12">Office</span>
                                        +94 72 629 4115
                                    </p>
                                    <p className="flex items-center gap-2 font-medium text-slate-600">
                                        <span className="text-[10px] uppercase text-slate-300 font-bold w-12">Support</span>
                                        +94 77 536 4754
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-right flex flex-col items-end">
                            <div className="mb-8 print:mb-4">
                                <h2 className="text-6xl font-black text-slate-100 uppercase tracking-tighter mb-[-0.3em] opacity-40 select-none print:text-4xl">
                                    {invoice.document_type}
                                </h2>
                                <h1 className="text-4xl font-black text-slate-900 uppercase relative z-10">{docTitle}</h1>
                            </div>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm border-t border-slate-100 pt-6 print:pt-3">
                                <span className="text-slate-400 font-medium">Document Number</span>
                                <span className="text-slate-900 font-bold">{invoice.document_number}</span>
                                <span className="text-slate-400 font-medium">Date of Issue</span>
                                <span className="text-slate-900 font-bold">{formatDate(invoice.date)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-12 mb-16 print:mb-8">
                        {/* Bill To */}
                        <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">Invoice To</h3>
                            <div className="space-y-1">
                                <p className="text-lg font-black text-indigo-600">{invoice.client?.name || '—'}</p>
                                <div className="text-sm text-slate-500 space-y-0.5 leading-relaxed max-w-[280px]">
                                    {invoice.client?.address && <p>{invoice.client.address}</p>}
                                    {invoice.client?.phone && <p className="font-medium text-slate-600 pt-1">{invoice.client.phone}</p>}
                                </div>
                            </div>
                        </div>

                        {/* Payment Status (Visual Badge) */}
                        <div className="flex flex-col items-end justify-center">
                            <div className={`px-6 py-2 rounded-full border-2 text-sm font-black uppercase tracking-widest ${invoice.status === 'paid' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                invoice.status === 'sent' ? 'bg-blue-50 border-blue-100 text-blue-600' :
                                    invoice.status === 'accepted' ? 'bg-indigo-50 border-indigo-100 text-indigo-600' :
                                        'bg-slate-50 border-slate-100 text-slate-400'
                                }`}>
                                {invoice.status}
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="mb-12 print:mb-6 overflow-hidden rounded-xl border border-slate-100 shadow-sm print:shadow-none">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-slate-900 text-white">
                                    <th className="text-left px-8 py-5 print:py-3 font-bold text-[10px] uppercase tracking-widest">Description</th>
                                    <th className="text-center px-4 py-5 print:py-3 font-bold text-[10px] uppercase tracking-widest w-[100px]">Qty</th>
                                    <th className="text-right px-4 py-5 print:py-3 font-bold text-[10px] uppercase tracking-widest w-[150px]">Price</th>
                                    <th className="text-right px-8 py-5 print:py-3 font-bold text-[10px] uppercase tracking-widest w-[180px]">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {invoice.items.map((item, i) => (
                                    <tr key={item.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 print:py-2">
                                            <p className="font-bold text-slate-900">{item.description}</p>
                                        </td>
                                        <td className="px-4 py-5 print:py-2 text-center font-medium text-slate-600">{item.quantity}</td>
                                        <td className="px-4 py-5 print:py-2 text-right font-medium text-slate-600 font-mono text-xs tracking-tight">{fmt(item.unit_price)}</td>
                                        <td className="px-8 py-5 print:py-2 text-right font-bold text-slate-900 font-mono tracking-tight">{fmt(item.total)}</td>
                                    </tr>
                                ))}
                                {/* Empty Spacer Rows for Clean Layout */}
                                {invoice.items.length < 5 && Array.from({ length: 5 - invoice.items.length }).map((_, i) => (
                                    <tr key={`spacer-${i}`}>
                                        <td className="px-8 py-5 print:py-2 h-12 print:h-8"></td>
                                        <td className="px-4 py-5 print:py-2 text-center"></td>
                                        <td className="px-4 py-5 print:py-2 text-right"></td>
                                        <td className="px-8 py-5 print:py-2 text-right"></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Section */}
                    <div className="flex gap-16 print:gap-8 pt-8 print:pt-4">
                        {/* Notes & Bank Details */}
                        <div className="flex-1">
                            <div className="grid grid-cols-1 gap-10 print:gap-4">
                                {invoice.remarks && (
                                    <div className="p-6 print:p-4 bg-slate-50/80 rounded-2xl border border-slate-100">
                                        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3 print:mb-1">Notes & Observations</h4>
                                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{invoice.remarks}</p>
                                    </div>
                                )}
                                <div className="p-6 print:p-4 bg-indigo-50/30 rounded-2xl border border-indigo-100/50">
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400 mb-4 print:mb-2">Settlement Details</h4>
                                    <div className="grid grid-cols-1 gap-3 print:gap-1">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Financial Institute</p>
                                            <p className="text-sm font-black text-slate-800">Commercial Bank <span className="text-[10px] font-medium text-slate-400 ml-1">(Arpico Branch Negombo)</span></p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Payee Name</p>
                                                <p className="text-sm font-bold text-slate-800">Mohamed Aakidh</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Account Number</p>
                                                <p className="text-sm font-black text-indigo-600 font-mono tracking-wider">8256005151</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Summary Block */}
                        <div className="w-[320px]">
                            <div className="space-y-3 print:space-y-1 p-8 print:p-5 border border-slate-100 rounded-2xl shadow-sm bg-slate-50/30">
                                <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                    <span>Subtotal</span>
                                    <span className="text-slate-900 font-mono tracking-tighter text-sm font-bold">{fmt(invoice.subtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                    <span>Discount</span>
                                    <span className="text-rose-500 font-mono tracking-tighter text-sm font-bold">-{fmt(invoice.discount)}</span>
                                </div>
                                <div className="h-[1px] bg-slate-200 my-2 print:my-1" />
                                <div className="flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-widest">
                                    <span>Taxable Amount</span>
                                    <span className="text-slate-900 font-mono tracking-tighter text-sm font-bold">{fmt(subtotalLessDiscount)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                    <span>Tax ({fmt(invoice.tax_rate)}%)</span>
                                    <span className="text-slate-900 font-mono tracking-tighter text-sm font-bold">+{fmt(totalTax)}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-widest">
                                    <span>Shipping</span>
                                    <span className="text-slate-900 font-mono tracking-tighter text-sm font-bold">+{fmt(invoice.shipping)}</span>
                                </div>

                                {/* Grand Total */}
                                <div className="pt-3 mt-3 border-t border-slate-200/50">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 uppercase tracking-widest">
                                        <span>Grand Total</span>
                                        <span className="font-mono tracking-tighter text-base">{fmt(subtotalLessDiscount + totalTax + invoice.shipping)}</span>
                                    </div>
                                </div>

                                {/* ONLY show Advance Paid line if there is a Balance Due. 
                                    If Fully Paid, we show "TOTAL PAID" at the bottom instead. */}
                                {invoice.advance_paid > 0 && balance > 0 && (
                                    <div className="flex justify-between items-center text-xs font-semibold text-emerald-600 uppercase tracking-widest mt-2">
                                        <span>Advance Paid</span>
                                        <span className="font-mono tracking-tighter text-sm font-bold">-{fmt(invoice.advance_paid)}</span>
                                    </div>
                                )}

                                <div className="pt-4 mt-4 print:pt-3 print:mt-2 border-t-2 border-slate-900">
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-black uppercase tracking-widest text-slate-900 pb-1">
                                            {balance <= 0 ? 'Total Paid' : 'Balance Due'}
                                        </span>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1 text-right">Sri Lankan Rupees</p>
                                            <p className="text-3xl font-black text-slate-900 tracking-tighter print:text-2xl">
                                                LKR {fmt(balance <= 0 ? invoice.advance_paid : balance)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[9px] text-center text-slate-300 font-bold uppercase tracking-[0.3em] mt-8 print:mt-4 select-none">Thank you for choosing URTHLY</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print styles */}
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                @media print {
                    @page {
                        margin: 0;
                        size: A4;
                    }
                    html, body {
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background: white !important;
                    }
                    .print\:hidden { display: none !important; }
                    .print\:m-0 { margin: 0 !important; }
                    .print\:shadow-none { box-shadow: none !important; }
                    .print\:p-8 { padding: 2rem !important; }
                    aside, header, nav, footer { display: none !important; }
                    main { padding: 0 !important; overflow: visible !important; height: auto !important; }
                    .min-h-screen { min-height: auto !important; height: auto !important; background: white !important; }
                    table, .rounded-2xl { break-inside: avoid; }
                    .grid { break-inside: avoid; }
                }
            `}</style>
        </div>
    )
}
