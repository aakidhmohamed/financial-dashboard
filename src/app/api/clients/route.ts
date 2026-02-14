import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
    try {
        const supabase = await createClient()

        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('name', { ascending: true })

        if (error) throw error

        return NextResponse.json({ data: data || [] })
    } catch (error) {
        console.error('Clients GET error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch clients' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient()
        const body = await request.json()

        const { data, error } = await supabase
            .from('clients')
            .insert(body)
            .select('*')
            .single()

        if (error) throw error

        return NextResponse.json(data, { status: 201 })
    } catch (error) {
        console.error('Clients POST error:', error)
        return NextResponse.json(
            { error: 'Failed to create client' },
            { status: 500 }
        )
    }
}
