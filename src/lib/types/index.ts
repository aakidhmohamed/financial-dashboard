import type { Database } from './database'

// Helper type aliases
export type Account = Database['public']['Tables']['accounts']['Row']
export type Category = Database['public']['Tables']['categories']['Row']
export type Client = Database['public']['Tables']['clients']['Row']
export type Supplier = Database['public']['Tables']['suppliers']['Row']
export type Transaction = Database['public']['Tables']['transactions']['Row']
export type Renewal = Database['public']['Tables']['renewals']['Row']
export type Invoice = Database['public']['Tables']['invoices']['Row']
export type InvoiceItem = Database['public']['Tables']['invoice_items']['Row']
export type Loan = Database['public']['Tables']['loans']['Row']
export type LoanPayment = Database['public']['Tables']['loan_payments']['Row']

// API Response types
export interface DashboardSummary {
    netWorth: number
    totalAssets: number
    totalLiabilities: number
    cashBalance: number
    revenueThisMonth: number
    expensesThisMonth: number
    netProfitThisMonth: number
    capitalThisMonth: number
    upcomingRenewals: number
    accountBalances: Account[]
    recentTransactions: TransactionWithRelations[]
}

export interface TransactionWithRelations extends Transaction {
    category: Category
    client?: Client | null
    supplier?: Supplier | null
    account: Account
}

export interface RenewalWithRelations extends Renewal {
    transaction: Transaction
    client?: Client | null
}

export interface InvoiceWithRelations extends Invoice {
    client: Client | null
    items: InvoiceItem[]
}

export interface LoanWithPayments extends Loan {
    loan_payments: LoanPayment[]
    account: Account
    liability_account: Account
}

export interface LoanSummary {
    totalOutstanding: number
    totalPrincipal: number
    activeCount: number
    paidCount: number
    borrowed: {
        totalOutstanding: number
        totalPrincipal: number
        activeCount: number
        paidCount: number
    }
    lent: {
        totalOutstanding: number
        totalPrincipal: number
        activeCount: number
        paidCount: number
    }
}

// Form input types
export type TransactionInput = Database['public']['Tables']['transactions']['Insert']
export type ClientInput = Database['public']['Tables']['clients']['Insert']
export type SupplierInput = Database['public']['Tables']['suppliers']['Insert']
export type InvoiceInput = Database['public']['Tables']['invoices']['Insert']
export type InvoiceItemInput = Database['public']['Tables']['invoice_items']['Insert']
export type LoanInput = Database['public']['Tables']['loans']['Insert']
export type LoanPaymentInput = Database['public']['Tables']['loan_payments']['Insert']

export interface InvoiceListItem {
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
