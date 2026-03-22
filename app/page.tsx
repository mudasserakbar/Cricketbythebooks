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
    // Supabase not configured — use fallback seed data
  }

  if (orgs.length === 0) {
    orgs = FALLBACK_ORGS
  }

  return (
    <div className="min-h-screen bg-white">
      <PageTracker page="/" />

      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">CP</span>
            </div>
            <span className="font-medium text-gray-800">
              Cricket Policy Assistant
            </span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/stats"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Stats
            </a>
            <a
              href="/contact"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Contact
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-semibold text-gray-900 mb-3">
            Get answers to your cricket policy questions
          </h1>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Select your organization below and ask any question about
            registration, eligibility, disciplinary rules, or playing
            regulations. Answers come directly from official policy documents.
          </p>
        </div>

        {/* Org selector */}
        <OrgSelector orgs={orgs} />

        {/* Top questions */}
        <TopQuestions />

        {/* Footer info */}
        <div className="mt-16 text-center">
          <p className="text-xs text-gray-400 max-w-lg mx-auto">
            This is a free, community-run tool. No login required. Your
            questions are anonymous. Answers are based on official documents only
            and do not constitute legal advice.
          </p>
          <PublicStats />
        </div>
      </main>
    </div>
  )
}
