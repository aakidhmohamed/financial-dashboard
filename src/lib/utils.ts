import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/**
 * Format number as LKR currency
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(amount)
}

/**
 * Format number as percentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`
}

/**
 * Format date string
 */
export function formatDate(dateString: string, format: 'short' | 'long' = 'short'): string {
    const date = new Date(dateString)
    if (format === 'long') {
        return date.toLocaleDateString('en-LK', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }
    return date.toLocaleDateString('en-LK')
}

/**
 * Get relative time string (e.g., "2 days ago", "in 3 months")
 */
export function getRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = date.getTime() - now.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (Math.abs(diffDays) === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays > 0 && diffDays < 30) return `In ${diffDays} days`
    if (diffDays < 0 && diffDays > -30) return `${Math.abs(diffDays)} days ago`

    const diffMonths = Math.floor(diffDays / 30)
    if (diffMonths > 0) return `In ${diffMonths} month${diffMonths > 1 ? 's' : ''}`
    return `${Math.abs(diffMonths)} month${Math.abs(diffMonths) > 1 ? 's' : ''} ago`
}
