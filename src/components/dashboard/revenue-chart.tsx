'use client'

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'
import { formatCurrency } from '@/lib/utils'

interface DailyRevenue {
    day: string
    label: string
    revenue: number
}

interface RevenueChartProps {
    data: DailyRevenue[]
}

export function RevenueChart({ data }: RevenueChartProps) {
    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[180px] text-sm text-muted-foreground">
                No revenue data for this period
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '0.75rem',
                        fontSize: '13px',
                        fontWeight: 600,
                    }}
                    formatter={(value) => [formatCurrency(Number(value)), 'Revenue']}
                    labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: 4 }}
                />
                <Bar
                    dataKey="revenue"
                    fill="hsl(var(--primary))"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={40}
                />
            </BarChart>
        </ResponsiveContainer>
    )
}
