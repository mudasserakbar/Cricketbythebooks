'use client'

import { useEffect, useState } from 'react'

interface SessionInfo {
  id: string
  title: string | null
  created_at: string
}

export function ConversationHistory({
  orgId,
  currentSessionId,
  onSelectSession,
}: {
  orgId: string
  currentSessionId: string
  onSelectSession: (sessionId: string) => void
}) {
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    // Gather all session IDs for this org from localStorage
    const ids: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('session_')) {
        ids.push(localStorage.getItem(key)!)
      }
    }

    if (ids.length <= 1) return

    fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionIds: ids }),
    })
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions || []))
      .catch(() => {})
  }, [orgId])

  if (sessions.length <= 1) return null

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        History
      </button>

      {open && (
        <div className="absolute top-6 right-0 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-medium text-gray-500">Recent conversations</p>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  onSelectSession(s.id)
                  setOpen(false)
                }}
                className={`w-full text-left px-3 py-2 text-xs hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                  s.id === currentSessionId ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600'
                }`}
              >
                <p className="truncate">{s.title || 'Untitled conversation'}</p>
                <p className="text-gray-400 mt-0.5">
                  {new Date(s.created_at).toLocaleDateString()}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
