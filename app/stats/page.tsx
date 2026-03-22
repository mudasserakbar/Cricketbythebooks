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
    <div className="min-h-screen bg-white">
      <PageTracker page="/stats" />

      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">CP</span>
            </div>
            <span className="font-medium text-gray-800 text-sm">Community Stats</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">
            Cricket Policy Assistant — Community Stats
          </h1>
          <p className="text-sm text-gray-500">
            Live usage data from across the Canadian cricket community. Updated in real time.
          </p>
        </div>

        {stats ? (
          <>
            {/* Key metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
              <StatCard label="Questions Answered" value={stats.totalAnswered} />
              <StatCard label="This Week" value={stats.questionsThisWeek} />
              <StatCard label="Unique Users" value={stats.totalSessions} />
              <StatCard label="Documents Loaded" value={stats.totalDocs} />
            </div>

            {/* Where visitors are from */}
            {stats.topProvinces.length > 0 && (
              <div className="mb-10">
                <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                  Where visitors are from
                </h2>
                <div className="space-y-2">
                  {stats.topProvinces.map((p, i) => {
                    const maxCount = stats.topProvinces[0].count
                    const pct = maxCount > 0 ? (p.count / maxCount) * 100 : 0
                    return (
                      <div key={i} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 w-32 flex-shrink-0">
                          {p.province}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 w-8 text-right">{p.count}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Peak hours */}
            <div className="mb-10">
              <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
                When people ask questions (last 30 days)
              </h2>
              <div className="flex items-end gap-1 h-24">
                {stats.peakHours.map((count, hour) => {
                  const max = Math.max(...stats.peakHours, 1)
                  const pct = (count / max) * 100
                  return (
                    <div
                      key={hour}
                      className="flex-1 bg-emerald-100 hover:bg-emerald-200 rounded-t transition-colors relative group"
                      style={{ height: `${Math.max(pct, 2)}%` }}
                    >
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                        {hour}:00 — {count}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">12am</span>
                <span className="text-xs text-gray-400">6am</span>
                <span className="text-xs text-gray-400">12pm</span>
                <span className="text-xs text-gray-400">6pm</span>
                <span className="text-xs text-gray-400">12am</span>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-50 rounded-xl p-6 animate-pulse">
                <div className="h-3 bg-gray-200 rounded w-20 mb-2" />
                <div className="h-6 bg-gray-200 rounded w-12" />
              </div>
            ))}
          </div>
        )}

        <div className="text-center mt-12">
          <p className="text-xs text-gray-400">
            All data is anonymous. No personal information is collected or stored.
          </p>
        </div>
      </main>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-50 rounded-xl p-5 text-center">
      <p className="text-2xl font-semibold text-gray-900">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 mt-1">{label}</p>
    </div>
  )
}
