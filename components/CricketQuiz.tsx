'use client'

import { useState, useEffect } from 'react'

interface QuizQuestion {
  id: string
  question: string
  options: string[]
}

interface CricketQuizProps {
  onVerified: (token: string) => void
}

export function CricketQuiz({ onVerified }: CricketQuizProps) {
  const [question, setQuestion] = useState<QuizQuestion | null>(null)
  const [token, setToken] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'checking' | 'wrong' | 'correct'>('loading')
  const [errorMsg, setErrorMsg] = useState('')

  const fetchQuestion = async () => {
    setStatus('loading')
    setSelected(null)
    setErrorMsg('')
    try {
      const res = await fetch('/api/quiz')
      const data = await res.json()
      setQuestion(data.question)
      setToken(data.token)
      setStatus('ready')
    } catch {
      setErrorMsg('Failed to load. Please refresh.')
    }
  }

  useEffect(() => {
    fetchQuestion()
  }, [])

  const handleSubmit = async () => {
    if (selected === null) return
    setStatus('checking')

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, selectedIndex: selected }),
      })
      const data = await res.json()

      if (data.verified) {
        setStatus('correct')
        // Store verification in localStorage
        localStorage.setItem('cricket_verified', data.verificationToken)
        localStorage.setItem('cricket_verified_until', data.expiresAt.toString())
        setTimeout(() => onVerified(data.verificationToken), 800)
      } else if (data.reason === 'expired') {
        setErrorMsg('Question expired. Loading a new one...')
        setTimeout(fetchQuestion, 1000)
      } else {
        setStatus('wrong')
        setErrorMsg('Not quite right! Try again.')
        setSelected(null)
        setTimeout(() => {
          setStatus('ready')
          setErrorMsg('')
        }, 1500)
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('ready')
    }
  }

  if (status === 'loading' || !question) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 py-16">
        <div className="w-8 h-8 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12">
      <div className="w-full max-w-md">
        {/* Cricket ball icon */}
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 bg-red-600 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 4.5c0 5 3 7.5 3 7.5s-3 2.5-3 7.5" strokeLinecap="round" />
              <path d="M16 4.5c0 5-3 7.5-3 7.5s3 2.5 3 7.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-gray-900 text-center mb-1">
          Quick cricket check
        </h2>
        <p className="text-sm text-gray-500 text-center mb-6">
          Answer one question to get started. Easy if you know cricket!
        </p>

        {/* Question */}
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-5 mb-4">
          <p className="text-sm font-medium text-gray-800 mb-4">
            {question.question}
          </p>
          <div className="space-y-2">
            {question.options.map((option, i) => (
              <button
                key={i}
                onClick={() => status === 'ready' && setSelected(i)}
                disabled={status !== 'ready'}
                className={`w-full text-left text-sm px-4 py-2.5 rounded-lg border transition-all ${
                  selected === i
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50/50'
                } ${status === 'correct' && selected === i ? 'bg-emerald-100 border-emerald-400' : ''}
                  ${status === 'wrong' && selected === i ? 'bg-red-50 border-red-300 text-red-700' : ''}`}
              >
                <span className="font-medium text-xs text-gray-400 mr-2">
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Error / feedback */}
        {errorMsg && (
          <p className={`text-xs text-center mb-3 ${status === 'wrong' ? 'text-red-600' : 'text-amber-600'}`}>
            {errorMsg}
          </p>
        )}

        {/* Success message */}
        {status === 'correct' && (
          <div className="flex items-center justify-center gap-2 mb-3">
            <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm text-emerald-700 font-medium">Howzat! You're in.</span>
          </div>
        )}

        {/* Submit button */}
        {status !== 'correct' && (
          <button
            onClick={handleSubmit}
            disabled={selected === null || status === 'checking' || status === 'wrong'}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
          >
            {status === 'checking' ? 'Checking...' : status === 'wrong' ? 'Oops!' : 'Verify'}
          </button>
        )}

        <p className="text-xs text-gray-400 text-center mt-4">
          This keeps bots out and cricket people in.
        </p>
      </div>
    </div>
  )
}

// Helper: check if user is already verified
export function isQuizVerified(): boolean {
  if (typeof window === 'undefined') return false
  const expiresAt = localStorage.getItem('cricket_verified_until')
  if (!expiresAt) return false
  return Date.now() < parseInt(expiresAt)
}

export function getVerificationToken(): string | null {
  if (!isQuizVerified()) return null
  return localStorage.getItem('cricket_verified')
}
