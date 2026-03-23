'use client'

import Link from 'next/link'
import type { Organization } from '@/lib/types'

// Orgs with documents loaded — the rest show as "Coming Soon"
const LIVE_ORGS = ['cricket-canada', 'cricket-bc']

export function OrgSelector({ orgs }: { orgs: Organization[] }) {
  const national = orgs.filter((o) => o.level === 'national')
  const provincial = orgs.filter((o) => o.level === 'provincial')

  return (
    <div className="space-y-8">
      {/* National */}
      {national.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            National
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {national.map((org) => (
              <OrgCard key={org.id} org={org} live={LIVE_ORGS.includes(org.slug)} />
            ))}
          </div>
        </div>
      )}

      {/* Provincial */}
      {provincial.length > 0 && (
        <div>
          <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
            Provincial
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {provincial.map((org) => (
              <OrgCard key={org.id} org={org} live={LIVE_ORGS.includes(org.slug)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OrgCard({ org, live }: { org: Organization; live: boolean }) {
  if (!live) {
    return (
      <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 opacity-60 cursor-default">
        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
          <span className="text-gray-400 text-xs font-bold">
            {org.name
              .replace('Cricket ', '')
              .slice(0, 2)
              .toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-500">
            {org.name}
          </p>
          {org.province && (
            <p className="text-xs text-gray-400">{org.province}</p>
          )}
        </div>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full flex-shrink-0">
          Coming Soon
        </span>
      </div>
    )
  }

  return (
    <Link
      href={`/ask?org=${org.slug}`}
      className="group flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
    >
      <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
        <span className="text-emerald-700 text-xs font-bold">
          {org.name
            .replace('Cricket ', '')
            .slice(0, 2)
            .toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 group-hover:text-emerald-700 transition-colors">
          {org.name}
        </p>
        {org.province && (
          <p className="text-xs text-gray-400">{org.province}</p>
        )}
      </div>
      <svg
        className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5l7 7-7 7"
        />
      </svg>
    </Link>
  )
}
