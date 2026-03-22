'use client'

import { useState } from 'react'

export function FeedbackButtons({
  messageId,
  sessionId,
}: {
  messageId: string
  sessionId: string
}) {
  const [submitted, setSubmitted] = useState<boolean | null>(null)

  const submit = async (helpful: boolean) => {
    setSubmitted(helpful)
    try {
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, sessionId, helpful }),
      })
    } catch {
      // Silent fail
    }
  }

  if (submitted !== null) {
    return (
      <p className="text-xs text-gray-400 mt-1">
        {submitted ? 'Thanks for the feedback!' : 'Thanks — we\'ll work on improving this.'}
      </p>
    )
  }

  return (
    <div className="flex items-center gap-1 mt-1">
      <span className="text-xs text-gray-400 mr-1">Helpful?</span>
      <button
        onClick={() => submit(true)}
        className="text-gray-300 hover:text-emerald-500 transition-colors p-0.5"
        title="Yes, helpful"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
        </svg>
      </button>
      <button
        onClick={() => submit(false)}
        className="text-gray-300 hover:text-red-400 transition-colors p-0.5"
        title="Not helpful"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
        </svg>
      </button>
    </div>
  )
}
