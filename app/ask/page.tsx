'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { ChatInterface } from '@/components/ChatInterface'
import { CricketQuiz, isQuizVerified } from '@/components/CricketQuiz'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { getOrCreateSession } from '@/lib/session'
import type { Organization } from '@/lib/types'
import { FALLBACK_ORGS_BY_SLUG } from '@/lib/fallback-orgs'

function AskContent() {
  const searchParams = useSearchParams()
  const orgSlug = searchParams.get('org')

  const [org, setOrg] = useState<Organization | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    setVerified(isQuizVerified())
  }, [])

  useEffect(() => {
    if (!orgSlug) return
    const init = async () => {
      try {
        const supabase = createClientSupabaseClient()
        const { data } = await supabase
          .from('organizations')
          .select('*')
          .eq('slug', orgSlug)
          .single()
        if (data) {
          setOrg(data as Organization)
          const sid = await getOrCreateSession(data.id)
          setSessionId(sid)
          setLoading(false)
          return
        }
      } catch {}
      const fallback = FALLBACK_ORGS_BY_SLUG[orgSlug]
      if (fallback) {
        setOrg(fallback)
        setSessionId(crypto.randomUUID())
      }
      setLoading(false)
    }
    init()
  }, [orgSlug])

  if (!orgSlug) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="text-center animate-fade-in">
          <p className="text-gray-500 mb-4">No organization selected.</p>
          <a href="/" className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold">
            Select an organization
          </a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-hero">
        <div className="text-center animate-fade-in">
          <p className="text-gray-500 mb-4">Organization not found.</p>
          <a href="/" className="text-emerald-600 hover:text-emerald-700 text-sm font-semibold">
            Select an organization
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top bar */}
      <header className="glass sticky top-0 z-50 border-b border-gray-100/50 flex-shrink-0">
        <div className="max-w-3xl mx-auto px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="text-gray-400 hover:text-emerald-600 transition-colors p-1 rounded-lg hover:bg-emerald-50">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div className="w-8 h-8 gradient-emerald rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 4.5c0 5 3 7.5 3 7.5s-3 2.5-3 7.5" strokeLinecap="round" />
                <path d="M16 4.5c0 5-3 7.5-3 7.5s3 2.5 3 7.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900 text-sm tracking-tight">
              Cricket Policy Assistant
            </span>
          </div>
          <a href="/contact" className="text-xs text-gray-500 hover:text-emerald-600 px-3 py-1.5 rounded-lg hover:bg-emerald-50/80 transition-all">
            Need help?
          </a>
        </div>
      </header>

      {/* Quiz gate or Chat */}
      <div className="flex-1 overflow-hidden max-w-3xl mx-auto w-full">
        {verified ? (
          <ChatInterface org={org} sessionId={sessionId!} />
        ) : (
          <CricketQuiz onVerified={() => setVerified(true)} />
        )}
      </div>
    </div>
  )
}

export default function AskPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center gradient-hero">
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        </div>
      }
    >
      <AskContent />
    </Suspense>
  )
}
