import { ContactPanel } from '@/components/ContactPanel'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a
              href="/"
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </a>
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">CP</span>
            </div>
            <span className="font-medium text-gray-800 text-sm">
              Cricket by the Books
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Contact support
          </h1>
          <p className="text-sm text-gray-500">
            Can&apos;t find what you need? Our volunteer team can help with
            specific policy questions, eligibility concerns, or other cricket
            governance matters.
          </p>
        </div>

        <ContactPanel />
      </main>
    </div>
  )
}
