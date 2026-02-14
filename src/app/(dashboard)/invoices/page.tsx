import { getInvoices } from '@/lib/data/invoices'
import { InvoicesClient } from './client-view'

export default async function InvoicesPage() {
    // Default to fetching invoices on the server
    const invoices = await getInvoices('invoice')

    return (
        <InvoicesClient initialInvoices={invoices} />
    )
}
