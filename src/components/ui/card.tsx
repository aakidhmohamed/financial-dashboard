import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
}

export function Card({ children, className, ...props }: CardProps) {
    return (
        <div
            className={cn(
                'bg-card rounded-2xl border border-border p-6 transition-shadow hover:shadow-md',
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}

export function CardHeader({ children, className, ...props }: CardProps) {
    return (
        <div className={cn('flex items-center justify-between mb-4', className)} {...props}>
            {children}
        </div>
    )
}

export function CardTitle({ children, className, ...props }: CardProps) {
    return (
        <h3 className={cn('text-lg font-bold', className)} {...props}>
            {children}
        </h3>
    )
}

export function CardContent({ children, className, ...props }: CardProps) {
    return (
        <div className={cn('', className)} {...props}>
            {children}
        </div>
    )
}
