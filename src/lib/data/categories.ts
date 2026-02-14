import { createClient } from '@/lib/supabase/server'
import type { Category } from '@/lib/types'

export async function getCategories(): Promise<Category[]> {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching categories:', error)
        return []
    }
    return data as Category[]
}
