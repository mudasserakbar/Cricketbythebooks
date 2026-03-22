'use client'

import Link from 'next/link'
import type { Organization } from '@/lib/types'

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
              <OrgCard key={org.id} org={org} />
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
              <OrgCard key={org.id} org={org} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function OrgCard({ org }: { org: Organization }) {
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
