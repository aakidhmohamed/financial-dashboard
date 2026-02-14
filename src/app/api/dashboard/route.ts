import { NextResponse } from 'next/server'
import { getDashboardData } from '@/lib/data/dashboard'

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const from = searchParams.get('from') || undefined
        const to = searchParams.get('to') || undefined

        const data = await getDashboardData(from, to)

        return NextResponse.json(data)
    } catch (error) {
        console.error('Dashboard API error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
        )
    }
}
