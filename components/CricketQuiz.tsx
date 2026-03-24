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
        setTimeout(() => { setStatus('ready'); setErrorMsg('') }, 1500)
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.')
      setStatus('ready')
    }
  }

  if (status === 'loading' || !question) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 py-16">
        <div className="w-10 h-10 border-2 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12 animate-fade-in">
      <div className="w-full max-w-md">
        {/* Cricket ball icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 4.5c0 5 3 7.5 3 7.5s-3 2.5-3 7.5" strokeLinecap="round" />
              <path d="M16 4.5c0 5-3 7.5-3 7.5s3 2.5 3 7.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 text-center mb-1.5 tracking-tight">
          Quick cricket check
        </h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          One question to get started. Easy if you know cricket!
        </p>

        {/* Question card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-soft mb-5">
          <p className="text-sm font-semibold text-gray-800 mb-5">
            {question.question}
          </p>
          <div className="space-y-2.5">
            {question.options.map((option, i) => (
              <button
                key={i}
                onClick={() => status === 'ready' && setSelected(i)}
                disabled={status !== 'ready'}
                className={`w-full text-left text-sm px-4 py-3 rounded-xl border-2 transition-all duration-200 ${
                  selected === i
                    ? 'bg-emerald-50 border-emerald-400 text-emerald-800 shadow-sm'
                    : 'bg-white border-gray-100 text-gray-600 hover:border-emerald-200 hover:bg-emerald-50/30'
                } ${status === 'correct' && selected === i ? 'bg-emerald-100 border-emerald-500' : ''}
                  ${status === 'wrong' && selected === i ? 'bg-red-50 border-red-300 text-red-700' : ''}`}
              >
                <span className="inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-md bg-gray-100 text-gray-500 mr-3">
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {errorMsg && (
          <p className={`text-xs text-center mb-4 font-medium ${status === 'wrong' ? 'text-red-500' : 'text-amber-600'}`}>
            {errorMsg}
          </p>
        )}

        {/* Success */}
        {status === 'correct' && (
          <div className="flex items-center justify-center gap-2 mb-4 animate-scale-in">
            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-sm text-emerald-700 font-semibold">Howzat! You&apos;re in.</span>
          </div>
        )}

        {/* Submit */}
        {status !== 'correct' && (
          <button
            onClick={handleSubmit}
            disabled={selected === null || status === 'checking' || status === 'wrong'}
            className="w-full gradient-emerald hover:opacity-90 disabled:opacity-30 text-white text-sm font-semibold py-3 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            {status === 'checking' ? 'Checking...' : status === 'wrong' ? 'Oops!' : 'Verify'}
          </button>
        )}

        <p className="text-[11px] text-gray-400 text-center mt-5">
          This keeps bots out and cricket people in.
        </p>
      </div>
    </div>
  )
}

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
