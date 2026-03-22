'use client'

import { useEffect, useState } from 'react'

export function PublicStats() {
  const [stats, setStats] = useState<{ totalAnswered: number } | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {})
  }, [])

  if (!stats || stats.totalAnswered === 0) return null

  return (
    <p className="text-xs text-gray-400 mt-2">
      {stats.totalAnswered.toLocaleString()} questions answered so far
    </p>
  )
}
