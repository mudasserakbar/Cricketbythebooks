'use client'

import { useEffect, useState } from 'react'

interface DocInfo {
  name: string
  type: string
  version: string | null
}

export function DocumentCoverage({ orgId }: { orgId: string }) {
  const [docs, setDocs] = useState<DocInfo[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch(`/api/org-docs?orgId=${orgId}`)
      .then((r) => r.json())
      .then((d) => setDocs(d.documents || []))
      .catch(() => {})
  }, [orgId])

  if (docs.length === 0) return null

  return (
    <div className="px-4 py-2 border-b border-gray-50">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {docs.length} document{docs.length !== 1 ? 's' : ''} loaded
        <svg className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {expanded && (
        <div className="mt-2 space-y-1">
          {docs.map((doc, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
              <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-400">{doc.type}</span>
              <span>{doc.name}</span>
              {doc.version && <span className="text-gray-300">({doc.version})</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
