import { createClient } from '@/lib/supabase/server'
import { cache } from 'react'
import type { Client } from '@/lib/types'

export const getClients = cache(async (): Promise<Client[]> => {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching clients:', error)
        return []
    }

    return data as Client[]
})
