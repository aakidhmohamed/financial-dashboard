'use client'

import { useState, useEffect } from 'react'
import { Plus, X, Pencil, Trash2, Truck } from 'lucide-react'

interface Supplier {
    id: string
    name: string
    phone: string | null
    email: string | null
    notes: string | null
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '' })

    const fetchSuppliers = () => {
        setLoading(true)
        fetch('/api/suppliers')
            .then(r => r.json())
            .then(d => {
                setSuppliers(d.data || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }

    useEffect(() => { fetchSuppliers() }, [])

    const resetForm = () => {
        setForm({ name: '', phone: '', email: '', notes: '' })
        setEditingId(null)
        setShowForm(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) return

        const body = {
            name: form.name.trim(),
            phone: form.phone.trim() || null,
            email: form.email.trim() || null,
            notes: form.notes.trim() || null,
        }

        if (editingId) {
            await fetch(`/api/suppliers/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
        } else {
            await fetch('/api/suppliers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
        }

        resetForm()
        fetchSuppliers()
    }

    const handleEdit = (supplier: Supplier) => {
        setForm({
            name: supplier.name,
            phone: supplier.phone || '',
            email: supplier.email || '',
            notes: supplier.notes || '',
        })
        setEditingId(supplier.id)
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this supplier?')) return
        await fetch(`/api/suppliers/${id}`, { method: 'DELETE' })
        fetchSuppliers()
    }

    const inputClasses = "w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground mb-1">Suppliers</h1>
                    <p className="text-muted-foreground text-sm">Manage your suppliers and their details.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true) }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Supplier
                </button>
            </div>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">{editingId ? 'Edit Supplier' : 'New Supplier'}</h3>
                        <button onClick={resetForm} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Name *</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className={inputClasses}
                                    placeholder="Supplier name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Phone</label>
                                <input
                                    type="text"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    className={inputClasses}
                                    placeholder="+1 234 567 890"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={e => setForm({ ...form, email: e.target.value })}
                                    className={inputClasses}
                                    placeholder="supplier@example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1.5">Notes</label>
                                <input
                                    type="text"
                                    value={form.notes}
                                    onChange={e => setForm({ ...form, notes: e.target.value })}
                                    className={inputClasses}
                                    placeholder="Additional notes"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-sm font-medium rounded-xl hover:bg-secondary transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all"
                            >
                                {editingId ? 'Save Changes' : 'Add Supplier'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Suppliers Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-secondary/50">
                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contact</th>
                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</th>
                            <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="text-center py-12 text-muted-foreground">Loading...</td>
                            </tr>
                        ) : suppliers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-12">
                                    <Truck className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                    <p className="font-semibold text-foreground">No suppliers yet</p>
                                    <p className="text-sm text-muted-foreground mt-1">Add your first supplier to get started.</p>
                                </td>
                            </tr>
                        ) : (
                            suppliers.map(supplier => (
                                <tr key={supplier.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                                    <td className="px-6 py-4 text-sm font-semibold">{supplier.name}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">
                                        <div className="flex flex-col">
                                            {supplier.phone && <span>{supplier.phone}</span>}
                                            {supplier.email && <span className="text-xs text-muted-foreground/80">{supplier.email}</span>}
                                            {!supplier.phone && !supplier.email && <span>—</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-[300px] truncate">{supplier.notes || '—'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(supplier)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(supplier.id)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
