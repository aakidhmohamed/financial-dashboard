import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('accounts')
            .select('*')
            .order('type', { ascending: true })
            .order('name', { ascending: true })

        if (error) throw error

        return NextResponse.json(data || [])
    } catch (error) {
        console.error('Accounts GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch accounts' },
            { status: 500 }
        )
    }
}
