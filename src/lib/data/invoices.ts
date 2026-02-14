import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import type { InvoiceListItem } from '@/lib/types'

export const getInvoices = cache(async (type: 'quotation' | 'invoice' = 'invoice'): Promise<InvoiceListItem[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('invoices')
        .select(`
            id,
            document_type,
            document_number,
            date,
            subtotal,
            discount,
            tax_rate,
            shipping,
            advance_paid,
            status,
            client:clients(id, name)
        `)
        .eq('document_type', type)
        .order('date', { ascending: false })

    if (error) {
        console.error(`Error fetching ${type}s:`, error)
        return []
    }

    return data as unknown as InvoiceListItem[]
})
