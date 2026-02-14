import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params
        const body = await request.json()

        const { data, error } = await supabase
            .from('clients')
            .update(body)
            .eq('id', id)
            .select('*')
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Client PUT error:', error)
        return NextResponse.json({ error: 'Failed to update client' }, { status: 500 })
    }
}

export async function DELETE(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params

        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Client DELETE error:', error)
        return NextResponse.json({ error: 'Failed to delete client' }, { status: 500 })
    }
}
