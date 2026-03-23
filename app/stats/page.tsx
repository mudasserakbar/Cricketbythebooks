'use client'

import { useEffect, useState } from 'react'
import { PageTracker } from '@/components/PageTracker'

interface Stats {
  totalAnswered: number
  totalSessions: number
  activeOrgs: number
  totalDocs: number
  questionsThisWeek: number
  topProvinces: { province: string; count: number }[]
  peakHours: number[]
}

export default function StatsPage() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen gradient-hero">
      <PageTracker page="/stats" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-gray-100/50">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-400 hover:text-emerald-600 transition-colors p-1 rounded-lg hover:bg-emerald-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div className="w-8 h-8 gradient-emerald rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" strokeLinecap="round" />
                <path d="M7 16l4-8 4 4 4-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-sm tracking-tight">Community Stats</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-10 animate-fade-in">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 tracking-tight">
            Community Stats
          </h1>
          <p className="text-sm text-gray-500">
            Live usage data from across the Canadian cricket community.
          </p>
        </div>

        {stats ? (
          <div className="space-y-10 animate-slide-up">
            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="Questions Answered" value={stats.totalAnswered} accent />
              <StatCard label="This Week" value={stats.questionsThisWeek} />
              <StatCard label="Unique Users" value={stats.totalSessions} />
              <StatCard label="Documents" value={stats.totalDocs} />
            </div>

            {/* Where visitors are from */}
            {stats.topProvinces.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-soft">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
                  Where visitors are from
                </h2>
                <div className="space-y-3">
                  {stats.topProvinces.map((p, i) => {
                    const maxCount = stats.topProvinces[0].count
                    const pct = maxCount > 0 ? (p.count / maxCount) * 100 : 0
                    return (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-700 w-28 flex-shrink-0">
                          {p.province}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-emerald-400 to-emerald-600 h-full rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-500 w-8 text-right tabular-nums">{p.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Peak hours */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-soft">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-5">
                When people ask questions
              </h2>
              <div className="flex items-end gap-[3px] h-28">
                {stats.peakHours.map((count, hour) => {
                  const max = Math.max(...stats.peakHours, 1)
                  const pct = (count / max) * 100
                  return (
                    <div
                      key={hour}
                      className="flex-1 bg-gradient-to-t from-emerald-200 to-emerald-100 hover:from-emerald-300 hover:to-emerald-200 rounded-t-sm transition-all duration-200 relative group cursor-default"
                      style={{ height: `${Math.max(pct, 3)}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        {hour}:00 &mdash; {count}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-2">
                <span className="text-[10px] text-gray-400">12am</span>
                <span className="text-[10px] text-gray-400">6am</span>
                <span className="text-[10px] text-gray-400">12pm</span>
                <span className="text-[10px] text-gray-400">6pm</span>
                <span className="text-[10px] text-gray-400">12am</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse shadow-soft">
                <div className="h-3 bg-gray-200 rounded w-20 mb-3" />
                <div className="h-7 bg-gray-200 rounded w-14" />
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-16">
          <p className="text-[11px] text-gray-400">
            All data is anonymous. No personal information is collected.
          </p>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className={`rounded-2xl p-5 text-center border shadow-soft ${
      accent
        ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-100'
        : 'bg-white border-gray-100'
    }`}>
      <p className={`text-3xl font-bold tabular-nums ${accent ? 'text-emerald-700' : 'text-gray-900'}`}>
        {value.toLocaleString()}
      </p>
      <p className="text-[11px] text-gray-500 mt-1.5 font-medium">{label}</p>
    </div>
  )
}
