'use client'

import { useState } from 'react'
import { Plus, X, Pencil, Trash2, Users } from 'lucide-react'
import type { Client } from '@/lib/types'

interface ClientsClientProps {
    initialClients: Client[]
}

export function ClientsClient({ initialClients }: ClientsClientProps) {
    const [clients, setClients] = useState<Client[]>(initialClients)
    const [loading, setLoading] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState({ name: '', phone: '', address: '' })

    const fetchClients = () => {
        setLoading(true)
        fetch('/api/clients')
            .then(r => r.json())
            .then(d => {
                setClients(d.data || [])
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }

    const resetForm = () => {
        setForm({ name: '', phone: '', address: '' })
        setEditingId(null)
        setShowForm(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!form.name.trim()) return

        const body = {
            name: form.name.trim(),
            phone: form.phone.trim() || null,
            address: form.address.trim() || null,
        }

        if (editingId) {
            await fetch(`/api/clients/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
        } else {
            await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            })
        }

        resetForm()
        fetchClients()
    }

    const handleEdit = (client: Client) => {
        setForm({
            name: client.name,
            phone: client.phone || '',
            address: client.address || '',
        })
        setEditingId(client.id)
        setShowForm(true)
    }

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this client?')) return
        await fetch(`/api/clients/${id}`, { method: 'DELETE' })
        fetchClients()
    }

    const inputClasses = "w-full px-3 py-2.5 bg-secondary border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-foreground mb-1">Clients</h1>
                    <p className="text-muted-foreground text-sm">Manage your clients and their details.</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowForm(true) }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
                >
                    <Plus className="w-4 h-4" />
                    Add Client
                </button>
            </div>

            {/* Add/Edit Form Modal */}
            {showForm && (
                <div className="bg-card border border-border rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-lg">{editingId ? 'Edit Client' : 'New Client'}</h3>
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
                                    placeholder="Client name"
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
                                    placeholder="+94 77 123 4567"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1.5">Address</label>
                            <textarea
                                value={form.address}
                                onChange={e => setForm({ ...form, address: e.target.value })}
                                className={inputClasses}
                                rows={2}
                                placeholder="Client address (used in invoices)"
                            />
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
                                {editingId ? 'Save Changes' : 'Add Client'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Clients Table */}
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-border bg-secondary/50">
                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Phone</th>
                            <th className="text-left px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Address</th>
                            <th className="text-right px-6 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && clients.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-12 text-muted-foreground">Loading...</td>
                            </tr>
                        ) : clients.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="text-center py-12">
                                    <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                                    <p className="font-semibold text-foreground">No clients yet</p>
                                    <p className="text-sm text-muted-foreground mt-1">Add your first client to get started.</p>
                                </td>
                            </tr>
                        ) : (
                            clients.map(client => (
                                <tr key={client.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                                    <td className="px-6 py-4 text-sm font-semibold">{client.name}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground">{client.phone || '—'}</td>
                                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-[300px] truncate">{client.address || '—'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleEdit(client)}
                                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4 text-muted-foreground" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(client.id)}
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
