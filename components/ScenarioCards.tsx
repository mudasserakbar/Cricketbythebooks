'use client'

import Link from 'next/link'
import { SCENARIOS } from '@/lib/scenarios'
import type { Organization } from '@/lib/types'

export function ScenarioCards({ orgs }: { orgs: Organization[] }) {
  const nationalOrg = orgs.find((o) => o.level === 'national' && o.slug === 'cricket-canada')
  const defaultSlug = nationalOrg?.slug || orgs[0]?.slug || 'cricket-canada'

  return (
    <section className="mt-10 mb-14">
      <div className="text-center mb-6">
        <h2 className="text-base font-semibold text-gray-700 mb-1">What brings you here today?</h2>
        <p className="text-sm text-gray-400">Pick your situation — we&apos;ll find the right policy</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {SCENARIOS.map((scenario, i) => (
          <Link
            key={scenario.id}
            href={`/ask?org=${defaultSlug}&scenario=${scenario.id}`}
            className={`group flex flex-col gap-2.5 bg-white border border-gray-100 rounded-2xl px-4 py-4 transition-all duration-200 hover:shadow-md ${scenario.borderColor} animate-slide-up`}
            style={{ animationDelay: `${i * 0.07}s`, animationFillMode: 'both' }}
          >
            <div
              className={`w-10 h-10 ${scenario.color} rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}
            >
              <span className="text-xl">{scenario.emoji}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800 group-hover:text-emerald-700 transition-colors leading-snug">
                {scenario.title}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{scenario.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
