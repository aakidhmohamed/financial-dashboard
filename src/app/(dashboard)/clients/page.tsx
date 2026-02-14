import { getClients } from '@/lib/data/clients'
import { ClientsClient } from './client-view'

export default async function ClientsPage() {
    const clients = await getClients()

    return (
        <ClientsClient initialClients={clients} />
    )
}
