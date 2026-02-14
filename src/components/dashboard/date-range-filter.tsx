'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CalendarIcon, ChevronDown, Monitor, Check } from 'lucide-react'
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO, isValid } from 'date-fns'
import { cn } from '@/lib/utils'

export function DateRangeFilter() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isOpen, setIsOpen] = useState(false)

    // Load initial state from URL or default to current month
    const initialFrom = searchParams.get('from')
    const initialTo = searchParams.get('to')

    const [dateRange, setDateRange] = useState({
        from: initialFrom ? initialFrom : format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        to: initialTo ? initialTo : format(endOfMonth(new Date()), 'yyyy-MM-dd')
    })

    // Check if current selection matches a preset
    const getActivePreset = () => {
        const from = dateRange.from
        const to = dateRange.to
        const now = new Date()

        if (from === format(startOfMonth(now), 'yyyy-MM-dd') && to === format(endOfMonth(now), 'yyyy-MM-dd')) return 'thisMonth'
        if (from === format(startOfMonth(subDays(now, 30)), 'yyyy-MM-dd') && to === format(endOfMonth(subDays(now, 30)), 'yyyy-MM-dd')) return 'lastMonth' // Approximate
        if (from === format(startOfYear(now), 'yyyy-MM-dd') && to === format(endOfYear(now), 'yyyy-MM-dd')) return 'thisYear'
        // Last 30 Days
        const last30Start = subDays(now, 29)
        if (from === format(last30Start, 'yyyy-MM-dd') && to === format(now, 'yyyy-MM-dd')) return 'last30Days'

        return 'custom'
    }

    const [activePreset, setActivePreset] = useState(getActivePreset())

    // Update active preset when date range changes
    useEffect(() => {
        setActivePreset(getActivePreset())
    }, [dateRange])

    const handleApply = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('from', dateRange.from)
        params.set('to', dateRange.to)
        router.push(`/?${params.toString()}`)
        setIsOpen(false)
    }

    const handlePresetSelect = (preset: string) => {
        const now = new Date()
        let newRange = { from: '', to: '' }

        switch (preset) {
            case 'thisMonth':
                newRange = {
                    from: format(startOfMonth(now), 'yyyy-MM-dd'),
                    to: format(endOfMonth(now), 'yyyy-MM-dd')
                }
                break
            case 'lastMonth':
                // Logic for actual last month
                const lastMonthDate = subDays(startOfMonth(now), 1)
                newRange = {
                    from: format(startOfMonth(lastMonthDate), 'yyyy-MM-dd'),
                    to: format(endOfMonth(lastMonthDate), 'yyyy-MM-dd')
                }
                break
            case 'last30Days':
                newRange = {
                    from: format(subDays(now, 29), 'yyyy-MM-dd'),
                    to: format(now, 'yyyy-MM-dd')
                }
                break
            case 'thisYear':
                newRange = {
                    from: format(startOfYear(now), 'yyyy-MM-dd'),
                    to: format(endOfYear(now), 'yyyy-MM-dd')
                }
                break
            case 'allTime':
                newRange = {
                    from: '2023-01-01', // Reasonable start date or dynamic earliest
                    to: format(now, 'yyyy-MM-dd')
                }
                break
        }

        if (newRange.from) {
            setDateRange(newRange)
            // Auto apply for presets
            const params = new URLSearchParams(searchParams.toString())
            params.set('from', newRange.from)
            params.set('to', newRange.to)
            router.push(`/?${params.toString()}`)
            setIsOpen(false)
        }
    }

    // Close on click outside (simple implementation)
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement
            if (isOpen && !target.closest('.date-range-filter')) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    return (
        <div className="relative date-range-filter">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-border rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
                <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                <span>
                    {activePreset === 'thisMonth' ? 'This Month' :
                        activePreset === 'last30Days' ? 'Last 30 Days' :
                            activePreset === 'thisYear' ? 'This Year' :
                                `${format(parseISO(dateRange.from), 'MMM d, yyyy')} - ${format(parseISO(dateRange.to), 'MMM d, yyyy')}`}
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </button>

            {isOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-border rounded-xl shadow-xl z-50 p-4 animate-in fade-in zoom-in-95 duration-200">
                    <div className="space-y-4">
                        <div>
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Presets</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <PresetButton
                                    label="This Month"
                                    onClick={() => handlePresetSelect('thisMonth')}
                                    active={activePreset === 'thisMonth'}
                                />
                                <PresetButton
                                    label="Last Month"
                                    onClick={() => handlePresetSelect('lastMonth')}
                                    active={activePreset === 'lastMonth'}
                                />
                                <PresetButton
                                    label="Last 30 Days"
                                    onClick={() => handlePresetSelect('last30Days')}
                                    active={activePreset === 'last30Days'}
                                />
                                <PresetButton
                                    label="This Year"
                                    onClick={() => handlePresetSelect('thisYear')}
                                    active={activePreset === 'thisYear'}
                                />
                                <PresetButton
                                    label="All Time"
                                    onClick={() => handlePresetSelect('allTime')}
                                    active={activePreset === 'allTime'}
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Custom Range</h4>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">From</label>
                                    <input
                                        type="date"
                                        value={dateRange.from}
                                        onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                                        className="w-full px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">To</label>
                                    <input
                                        type="date"
                                        value={dateRange.to}
                                        onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                                        className="w-full px-2 py-1.5 text-sm border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleApply}
                                className="w-full py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Apply Range
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

function PresetButton({ label, onClick, active }: { label: string, onClick: () => void, active: boolean }) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors text-left font-medium",
                active
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-secondary text-foreground hover:bg-secondary/80 border border-transparent"
            )}
        >
            {label}
        </button>
    )
}
