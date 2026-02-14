import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Get the next available document number
export async function GET(request: Request) {
    try {
        const supabase = await createClient()
        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') || 'invoice'

        const prefix = type === 'quotation' ? 'QUO' : 'INV'

        const { data: last } = await supabase
            .from('invoices')
            .select('document_number')
            .eq('document_type', type)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        let nextNum = 1
        if (last?.document_number) {
            const match = last.document_number.match(/(\d+)$/)
            if (match) nextNum = parseInt(match[1]) + 1
        }

        const nextNumber = `${prefix} ${String(nextNum).padStart(4, '0')}`

        return NextResponse.json({ nextNumber })
    } catch (error) {
        console.error('Next number error:', error)
        return NextResponse.json(
            { error: 'Failed to generate next number' },
            { status: 500 }
        )
    }
}
