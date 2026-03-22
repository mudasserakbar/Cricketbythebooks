'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState, Suspense } from 'react'
import { ChatInterface } from '@/components/ChatInterface'
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
      } catch {
        // Supabase not configured — use fallback
      }

      // Fallback to hardcoded org data
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No organization selected.</p>
          <a href="/" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
            Select an organization
          </a>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Organization not found.</p>
          <a href="/" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium">
            Select an organization
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top bar */}
      <header className="border-b border-gray-100 flex-shrink-0">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <a href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </a>
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">CP</span>
            </div>
            <span className="font-medium text-gray-800 text-sm">Cricket Policy Assistant</span>
          </div>
          <a href="/contact" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
            Need help?
          </a>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex-1 overflow-hidden max-w-3xl mx-auto w-full">
        <ChatInterface org={org} sessionId={sessionId!} />
      </div>
    </div>
  )
}

export default function AskPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      }
    >
      <AskContent />
    </Suspense>
  )
}
