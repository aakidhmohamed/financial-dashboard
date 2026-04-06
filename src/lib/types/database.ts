export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            accounts: {
                Row: {
                    id: string
                    name: string
                    type: 'asset' | 'liability'
                    balance: number
                    description: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    type: 'asset' | 'liability'
                    balance?: number
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    type?: 'asset' | 'liability'
                    balance?: number
                    description?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            categories: {
                Row: {
                    id: string
                    name: string
                    type: 'revenue' | 'expense' | 'capital' | 'transfer' | 'loan'
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    type: 'revenue' | 'expense'
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    type?: 'revenue' | 'expense'
                    created_at?: string
                }
            }
            clients: {
                Row: {
                    id: string
                    name: string
                    email: string | null
                    phone: string | null
                    address: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    address?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string | null
                    phone?: string | null
                    address?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            suppliers: {
                Row: {
                    id: string
                    name: string
                    email: string | null
                    phone: string | null
                    notes: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    email?: string | null
                    phone?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    email?: string | null
                    phone?: string | null
                    notes?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            transactions: {
                Row: {
                    id: string
                    date: string
                    type: 'revenue' | 'expense' | 'capital' | 'transfer' | 'loan'
                    category_id: string
                    amount: number
                    description: string | null
                    client_id: string | null
                    supplier_id: string | null
                    account_id: string
                    to_account_id: string | null
                    skip_balance_update: boolean
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    date?: string
                    type: 'revenue' | 'expense' | 'capital' | 'transfer' | 'loan'
                    category_id: string
                    amount: number
                    description?: string | null
                    client_id?: string | null
                    supplier_id?: string | null
                    account_id: string
                    to_account_id?: string | null
                    skip_balance_update?: boolean
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    date?: string
                    type?: 'revenue' | 'expense' | 'capital' | 'transfer'
                    category_id?: string
                    amount?: number
                    description?: string | null
                    client_id?: string | null
                    supplier_id?: string | null
                    account_id?: string
                    to_account_id?: string | null
                    skip_balance_update?: boolean
                    created_at?: string
                    updated_at?: string
                }
            }
            invoices: {
                Row: {
                    id: string
                    document_type: 'quotation' | 'invoice'
                    document_number: string
                    date: string
                    client_id: string | null
                    subtotal: number
                    discount: number
                    tax_rate: number
                    shipping: number
                    advance_paid: number
                    remarks: string | null
                    status: 'draft' | 'sent' | 'accepted' | 'expired' | 'paid'
                    quotation_id: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    document_type: 'quotation' | 'invoice'
                    document_number: string
                    date?: string
                    client_id?: string | null
                    subtotal?: number
                    discount?: number
                    tax_rate?: number
                    shipping?: number
                    advance_paid?: number
                    remarks?: string | null
                    status?: 'draft' | 'sent' | 'accepted' | 'expired' | 'paid'
                    quotation_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    document_type?: 'quotation' | 'invoice'
                    document_number?: string
                    date?: string
                    client_id?: string | null
                    subtotal?: number
                    discount?: number
                    tax_rate?: number
                    shipping?: number
                    advance_paid?: number
                    remarks?: string | null
                    status?: 'draft' | 'sent' | 'accepted' | 'expired' | 'paid'
                    quotation_id?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            invoice_items: {
                Row: {
                    id: string
                    invoice_id: string
                    description: string
                    quantity: number
                    unit_price: number
                    total: number
                    sort_order: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    invoice_id: string
                    description: string
                    quantity?: number
                    unit_price?: number
                    total?: number
                    sort_order?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    invoice_id?: string
                    description?: string
                    quantity?: number
                    unit_price?: number
                    total?: number
                    sort_order?: number
                    created_at?: string
                }
            }
            renewals: {
                Row: {
                    id: string
                    transaction_id: string
                    client_id: string | null
                    renewal_date: string
                    status: 'pending' | 'renewed' | 'expired'
                    notified_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    transaction_id: string
                    client_id?: string | null
                    renewal_date: string
                    status?: 'pending' | 'renewed' | 'expired'
                    notified_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    transaction_id?: string
                    client_id?: string | null
                    renewal_date?: string
                    status?: 'pending' | 'renewed' | 'expired'
                    notified_at?: string | null
                    created_at?: string
                }
            }
            loans: {
                Row: {
                    id: string
                    person_name: string
                    direction: 'borrowed' | 'lent'
                    amount: number
                    start_date: string
                    remaining_balance: number
                    status: 'active' | 'paid' | 'defaulted'
                    notes: string | null
                    account_id: string
                    liability_account_id: string
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    person_name: string
                    direction?: 'borrowed' | 'lent'
                    amount: number
                    start_date?: string
                    remaining_balance: number
                    status?: 'active' | 'paid' | 'defaulted'
                    notes?: string | null
                    account_id: string
                    liability_account_id: string
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    person_name?: string
                    direction?: 'borrowed' | 'lent'
                    amount?: number
                    start_date?: string
                    remaining_balance?: number
                    status?: 'active' | 'paid' | 'defaulted'
                    notes?: string | null
                    account_id?: string
                    liability_account_id?: string
                    created_at?: string
                    updated_at?: string
                }
            }
            loan_payments: {
                Row: {
                    id: string
                    loan_id: string
                    amount: number
                    date: string
                    notes: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    loan_id: string
                    amount: number
                    date?: string
                    notes?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    loan_id?: string
                    amount?: number
                    date?: string
                    notes?: string | null
                    created_at?: string
                }
            }
        }
        Views: {}
        Functions: {}
        Enums: {
            account_type: 'asset' | 'liability'
            transaction_type: 'revenue' | 'expense' | 'capital' | 'transfer' | 'loan'
            category_type: 'revenue' | 'expense' | 'capital' | 'transfer' | 'loan'
            renewal_status: 'pending' | 'renewed' | 'expired'
            document_type: 'quotation' | 'invoice'
            invoice_status: 'draft' | 'sent' | 'accepted' | 'expired' | 'paid'
            loan_status: 'active' | 'paid' | 'defaulted'
        }
    }
}
