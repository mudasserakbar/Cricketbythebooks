'use client'

import { useEffect, useState } from 'react'

interface TopQuestion {
  question: string
  askCount: number
}

export function TopQuestions() {
  const [questions, setQuestions] = useState<TopQuestion[]>([])

  useEffect(() => {
    fetch('/api/top-questions?limit=5')
      .then((r) => r.json())
      .then((d) => setQuestions(d.questions || []))
      .catch(() => {})
  }, [])

  if (questions.length === 0) return null

  return (
    <div className="mt-12">
      <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4 text-center">
        Popular questions
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl mx-auto">
        {questions.map((q, i) => (
          <div
            key={i}
            className="flex items-start gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2"
          >
            <span className="text-xs text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded flex-shrink-0">
              {q.askCount}x
            </span>
            <p className="text-xs text-gray-600 leading-relaxed">{q.question}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
