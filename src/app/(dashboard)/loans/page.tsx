import { getLoans, getLoanSummary } from '@/lib/data/loans'
import { getAccounts } from '@/lib/data/accounts'
import { LoansClient } from './client-view'

export default async function LoansPage() {
    const [loans, summary, accounts] = await Promise.all([
        getLoans(),
        getLoanSummary(),
        getAccounts(),
    ])

    return (
        <LoansClient
            initialLoans={loans}
            initialSummary={summary}
            accounts={accounts}
        />
    )
}
