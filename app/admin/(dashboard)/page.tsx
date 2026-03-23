'use client'

import { useEffect, useState } from 'react'

interface AnalyticsData {
  totalQuestions: number
  answersFound: number
  answerRate: number
  totalSessions: number
  supportRequests: number
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [days, setDays] = useState(30)

  useEffect(() => {
    fetch(`/api/analytics?days=${days}`)
      .then((r) => r.json())
      .then(setData)
  }, [days])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of Cricket by the Books usage
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Questions"
            value={data.totalQuestions}
            color="emerald"
          />
          <StatCard
            label="Answer Rate"
            value={`${data.answerRate}%`}
            color="blue"
          />
          <StatCard
            label="Unique Sessions"
            value={data.totalSessions}
            color="purple"
          />
          <StatCard
            label="Support Requests"
            value={data.supportRequests}
            color="amber"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
            >
              <div className="h-3 bg-gray-200 rounded w-24 mb-3" />
              <div className="h-6 bg-gray-200 rounded w-16" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string
  value: string | number
  color: string
}) {
  const colorMap: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-700',
    blue: 'bg-blue-50 text-blue-700',
    purple: 'bg-purple-50 text-purple-700',
    amber: 'bg-amber-50 text-amber-700',
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-2xl font-semibold text-gray-900">{value}</p>
      <div className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${colorMap[color]}`}>
        Last {30} days
      </div>
    </div>
  )
}
