import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import type { TransactionWithRelations } from '@/lib/types'

export const getTransactions = cache(async (): Promise<TransactionWithRelations[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('transactions')
        .select(`
            *,
            category:categories(*),
            client:clients(*),
            supplier:suppliers(*),
            account:accounts!transactions_account_id_fkey(*),
            to_account:accounts!transactions_to_account_id_fkey(*)
        `)
        .order('date', { ascending: false })

    if (error) {
        console.error('Error fetching transactions:', error)
        return []
    }

    return data as TransactionWithRelations[]
})

export const getTransaction = cache(async (id: string): Promise<TransactionWithRelations | null> => {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('transactions')
        .select(`
            *,
            category:categories(*),
            client:clients(*),
            supplier:suppliers(*),
            account:accounts!transactions_account_id_fkey(*),
            to_account:accounts!transactions_to_account_id_fkey(*)
        `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching transaction:', error)
        return null
    }

    return data as TransactionWithRelations
})
