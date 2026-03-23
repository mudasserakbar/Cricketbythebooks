import type { Citation } from '@/lib/types'

export function CitationCard({ citations }: { citations: Citation[] }) {
  const unique = Array.from(
    new Map(
      citations.map((c) => [c.documentName + c.sectionReference, c])
    ).values()
  )

  return (
    <div className="flex flex-wrap gap-1.5">
      {unique.map((c, i) => (
        <div
          key={i}
          className="inline-flex items-center gap-1.5 bg-emerald-50/80 border border-emerald-100 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-emerald-50"
        >
          <svg
            className="w-3 h-3 text-emerald-500 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <span className="text-[11px] font-medium text-emerald-700">
            {c.documentName}
            {c.sectionReference ? ` · ${c.sectionReference}` : ''}
          </span>
        </div>
      ))}
    </div>
  )
}
