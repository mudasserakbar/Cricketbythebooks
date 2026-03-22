'use client'

import { useEffect } from 'react'

export function PageTracker({
  page,
  orgId,
  sessionId,
}: {
  page: string
  orgId?: string
  sessionId?: string
}) {
  useEffect(() => {
    fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page, orgId, sessionId }),
    }).catch(() => {})
  }, [page, orgId, sessionId])

  return null
}
