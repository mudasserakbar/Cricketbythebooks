'use client'

export default function AdminError({
  error,
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center max-w-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Error</h2>
        <p className="text-sm text-gray-500 mb-4">{error.message || 'Something went wrong in the admin panel.'}</p>
        <button onClick={reset} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          Try again
        </button>
      </div>
    </div>
  )
}
