'use client'

export default function AskError({
  reset,
}: {
  error: Error
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Chat unavailable</h2>
        <p className="text-sm text-gray-500 mb-6">We couldn&apos;t load the chat. This may be a temporary issue.</p>
        <div className="flex gap-3 justify-center">
          <button onClick={reset} className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Try again
          </button>
          <a href="/" className="border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
            Pick another org
          </a>
        </div>
      </div>
    </div>
  )
}
