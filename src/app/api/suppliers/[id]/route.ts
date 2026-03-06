import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supplierSchema } from '@/lib/validations'

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient()
        const { id } = await params
        const body = await request.json()

        // Server-side validation
        const parsed = supplierSchema.safeParse(body)
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
                { status: 400 }
            )
        }

        const validData = parsed.data

        const { data, error } = await supabase
            .from('suppliers')
            .update({
                name: validData.name,
                email: validData.email || null,
                phone: validData.phone || null,
                notes: validData.notes || null,
            })
            .eq('id', id)
            .select('*')
            .single()

        if (error) throw error

        return NextResponse.json(data)
    } catch (error) {
        console.error('Supplier PUT error:', error)
        return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
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
            .from('suppliers')
            .delete()
            .eq('id', id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Supplier DELETE error:', error)
        return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
    }
}
