import { getTransactions } from '@/lib/data/transactions'
import { getCategories } from '@/lib/data/categories'
import { getAccounts } from '@/lib/data/accounts'
import { TransactionsClient } from './client-view'

export default async function TransactionsPage() {
    const [transactions, categories, accounts] = await Promise.all([
        getTransactions(),
        getCategories(),
        getAccounts()
    ])

    return (
        <TransactionsClient
            initialTransactions={transactions}
            categories={categories}
            accounts={accounts}
        />
    )
}

