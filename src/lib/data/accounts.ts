import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import type { Account } from '@/lib/types'

export const getAccounts = cache(async (): Promise<Account[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('type', { ascending: true })

    if (error) {
        console.error('Error fetching accounts:', error)
        return []
    }

    return data as Account[]
})
