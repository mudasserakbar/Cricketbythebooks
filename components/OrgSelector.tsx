'use client'

import Link from 'next/link'
import type { Organization } from '@/lib/types'

const LIVE_ORGS = ['cricket-canada', 'cricket-bc']

export function OrgSelector({ orgs }: { orgs: Organization[] }) {
  const national = orgs.filter((o) => o.level === 'national')
  const provincial = orgs.filter((o) => o.level === 'provincial')

  return (
    <div className="space-y-10">
      {/* National */}
      {national.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              National
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
          </div>
          <div className="grid grid-cols-1 gap-3">
            {national.map((org) => (
              <OrgCard key={org.id} org={org} live={LIVE_ORGS.includes(org.slug)} featured />
            ))}
          </div>
        </div>
      )}

      {/* Provincial */}
      {provincial.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
              Provincial
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
          </div>
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

function OrgCard({ org, live, featured }: { org: Organization; live: boolean; featured?: boolean }) {
  if (!live) {
    return (
      <div className="flex items-center gap-3 bg-gray-50/80 border border-gray-100 rounded-2xl px-5 py-4 cursor-default group">
        <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <span className="text-gray-400 text-xs font-bold tracking-wide">
            {org.name.replace('Cricket ', '').slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-400">{org.name}</p>
          {org.province && (
            <p className="text-xs text-gray-300">{org.province}</p>
          )}
        </div>
        <span className="text-[10px] font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full uppercase tracking-wider flex-shrink-0">
          Soon
        </span>
      </div>
    )
  }

  return (
    <Link
      href={`/ask?org=${org.slug}`}
      className={`group flex items-center gap-4 bg-white border rounded-2xl px-5 py-4 transition-all duration-300 hover:shadow-glow ${
        featured
          ? 'border-emerald-200 hover:border-emerald-300 shadow-soft'
          : 'border-gray-200 hover:border-emerald-300 shadow-soft'
      }`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
        featured
          ? 'gradient-emerald shadow-sm group-hover:shadow-md'
          : 'bg-emerald-50 group-hover:bg-emerald-100'
      }`}>
        <span className={`text-xs font-bold tracking-wide ${featured ? 'text-white' : 'text-emerald-700'}`}>
          {org.name.replace('Cricket ', '').slice(0, 2).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors">
          {org.name}
        </p>
        {org.province && (
          <p className="text-xs text-gray-400 mt-0.5">{org.province}</p>
        )}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {featured && (
          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Live
          </span>
        )}
        <svg
          className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all duration-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  )
}
