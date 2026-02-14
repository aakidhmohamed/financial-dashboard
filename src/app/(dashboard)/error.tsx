'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error('Dashboard Error:', error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong!</h2>
            <p className="text-gray-500 mb-6 max-w-md">
                We encountered an error while loading this page. This might be a temporary issue.
            </p>
            {process.env.NODE_ENV === 'development' && (
                <pre className="bg-gray-100 p-4 rounded text-xs text-left mb-6 overflow-auto max-w-lg w-full">
                    {error.message}
                    {error.stack && `\n${error.stack}`}
                </pre>
            )}
            <button
                onClick={
                    // Attempt to recover by trying to re-render the segment
                    () => reset()
                }
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
            >
                Try again
            </button>
        </div>
    )
}
