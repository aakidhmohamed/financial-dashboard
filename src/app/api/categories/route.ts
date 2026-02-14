import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('type', { ascending: true })
            .order('name', { ascending: true })

        if (error) throw error

        return NextResponse.json(data || [])
    } catch (error) {
        console.error('Categories GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch categories' },
            { status: 500 }
        )
    }
}
