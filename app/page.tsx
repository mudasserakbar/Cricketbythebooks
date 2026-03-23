import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { OrgSelector } from '@/components/OrgSelector'
import { TopQuestions } from '@/components/TopQuestions'
import { PublicStats } from '@/components/PublicStats'
import { PageTracker } from '@/components/PageTracker'
import { FALLBACK_ORGS } from '@/lib/fallback-orgs'
import type { Organization } from '@/lib/types'

export const revalidate = 60

export default async function HomePage() {
  let orgs: Organization[] = []
  try {
    const supabase = createAdminSupabaseClient()
    const { data } = await supabase
      .from('organizations')
      .select('*')
      .eq('is_active', true)
      .order('level', { ascending: true })
      .order('name', { ascending: true })
    orgs = (data as Organization[]) || []
  } catch {
    // Supabase not configured
  }

  if (orgs.length === 0) {
    orgs = FALLBACK_ORGS
  }

  return (
    <div className="min-h-screen gradient-hero">
      <PageTracker page="/" />

      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-gray-100/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 gradient-emerald rounded-xl flex items-center justify-center shadow-sm">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 4.5c0 5 3 7.5 3 7.5s-3 2.5-3 7.5" strokeLinecap="round" />
                <path d="M16 4.5c0 5-3 7.5-3 7.5s3 2.5 3 7.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <span className="font-semibold text-gray-900 tracking-tight">
                Cricket Policy Assistant
              </span>
              <span className="hidden sm:inline text-xs text-gray-400 ml-2 font-normal">
                by the community
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <a
              href="/stats"
              className="text-sm text-gray-500 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-emerald-50/80 transition-all"
            >
              Stats
            </a>
            <a
              href="/contact"
              className="text-sm text-gray-500 hover:text-emerald-600 px-3 py-2 rounded-lg hover:bg-emerald-50/80 transition-all"
            >
              Contact
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-6">
        <div className="pt-20 pb-16 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Free &middot; No login required &middot; Anonymous
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">
            Get answers to your<br />
            <span className="text-gradient">cricket policy questions</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto leading-relaxed">
            Select your organization and ask any question about rules,
            registration, eligibility, or disciplinary policies.
            Every answer cites the official source document.
          </p>
        </div>

        {/* Org selector */}
        <div className="animate-slide-up">
          <OrgSelector orgs={orgs} />
        </div>

        {/* Top questions */}
        <TopQuestions />

        {/* Footer */}
        <div className="mt-20 pb-12 text-center">
          <div className="inline-flex items-center gap-4 text-xs text-gray-400">
            <span>Community-run</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span>Document-grounded</span>
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            <span>Not legal advice</span>
          </div>
          <PublicStats />
        </div>
      </main>
    </div>
  )
}
