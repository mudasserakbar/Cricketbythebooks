import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { OrgSelector } from '@/components/OrgSelector'
import { ScenarioCards } from '@/components/ScenarioCards'
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
    <div className="min-h-screen gradient-hero relative overflow-hidden">
      <PageTracker page="/" />

      {/* Floating background decorations */}
      <div aria-hidden="true" className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-20 left-[8%] w-24 h-24 rounded-full border-2 border-emerald-100/40 animate-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3 right-[6%] w-16 h-16 rounded-full border border-emerald-100/30 animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-1/4 left-[15%] w-10 h-10 rounded-full bg-emerald-50/60 animate-float" style={{ animationDelay: '4s' }} />
        <div className="absolute top-2/3 right-[20%] w-8 h-8 rounded-full border border-teal-100/30 animate-float" style={{ animationDelay: '1s' }} />
      </div>

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
                Cricket by the Books
              </span>
              <span className="hidden sm:inline text-xs text-gray-400 ml-2 font-normal">
                for the community
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
        <div className="pt-16 pb-6 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-medium px-4 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            Free &middot; No login required &middot; Anonymous
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 tracking-tight leading-tight">
            Cricket rules got you<br />
            <span className="text-gradient">confused?</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
            Tell us what&apos;s happening — we&apos;ll find the answer in the
            official documents and cite exactly where it came from.
          </p>
        </div>

        {/* Scenario cards */}
        <div className="animate-slide-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
          <ScenarioCards orgs={orgs} />
        </div>

        {/* Org selector */}
        <div className="mt-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
            <p className="text-xs text-gray-400 font-medium whitespace-nowrap">or choose your organization directly</p>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
          </div>
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
