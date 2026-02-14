import { TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react'
import { cn, formatCurrency, formatPercentage } from '@/lib/utils'

interface MetricCardProps {
    title: string
    value: number
    change?: number
    trend?: 'up' | 'down'
    format?: 'currency' | 'number' | 'percentage'
    loading?: boolean
    subtitle?: string
    highlighted?: boolean
}

export function MetricCard({
    title,
    value,
    change,
    trend,
    format = 'currency',
    loading = false,
    subtitle,
    highlighted = false,
}: MetricCardProps) {
    const formattedValue = format === 'currency'
        ? formatCurrency(value)
        : format === 'percentage'
            ? formatPercentage(value)
            : value.toLocaleString()

    if (loading) {
        return (
            <div className="bg-card rounded-2xl border border-border p-6 animate-pulse">
                <div className="h-4 w-24 bg-muted rounded mb-4" />
                <div className="h-9 w-36 bg-muted rounded mb-2" />
                <div className="h-3 w-28 bg-muted rounded" />
            </div>
        )
    }

    return (
        <div
            className={cn(
                'rounded-2xl border p-6 transition-all hover:shadow-md',
                highlighted
                    ? 'bg-primary text-white border-primary'
                    : 'bg-card text-foreground border-border'
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <p className={cn(
                    'text-sm font-medium',
                    highlighted ? 'text-white/80' : 'text-muted-foreground'
                )}>
                    {title}
                </p>
                <div className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center',
                    highlighted ? 'bg-white/20' : 'bg-secondary'
                )}>
                    <ArrowUpRight className={cn(
                        'w-4 h-4',
                        highlighted ? 'text-white' : 'text-muted-foreground'
                    )} />
                </div>
            </div>

            <p className="text-3xl font-extrabold mb-1">{formattedValue}</p>

            {subtitle && (
                <div className="flex items-center gap-2 mt-2">
                    {change !== undefined && trend && (
                        <span
                            className={cn(
                                'inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full',
                                highlighted
                                    ? 'bg-white/20 text-white'
                                    : trend === 'up'
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-red-50 text-red-600'
                            )}
                        >
                            {trend === 'up' ? (
                                <TrendingUp className="w-3 h-3" />
                            ) : (
                                <TrendingDown className="w-3 h-3" />
                            )}
                            {Math.abs(change)}%
                        </span>
                    )}
                    <p className={cn(
                        'text-xs',
                        highlighted ? 'text-white/70' : 'text-muted-foreground'
                    )}>
                        {subtitle}
                    </p>
                </div>
            )}
        </div>
    )
}
