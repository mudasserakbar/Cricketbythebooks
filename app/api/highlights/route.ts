import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// GET: Fetch weekly highlights for an org (public, shareable)
export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('orgId')
  const weekStart = req.nextUrl.searchParams.get('week') // YYYY-MM-DD

  try {
    const supabase = createAdminSupabaseClient()

    if (orgId && weekStart) {
      // Get specific week's highlights
      const { data } = await supabase
        .from('weekly_highlights')
        .select('*')
        .eq('org_id', orgId)
        .eq('week_start', weekStart)
        .single()

      return NextResponse.json(data || null)
    }

    // Get latest highlights for all orgs
    const { data } = await supabase
      .from('weekly_highlights')
      .select('*, organizations(name, slug)')
      .order('week_start', { ascending: false })
      .limit(20)

    return NextResponse.json(data || [])
  } catch {
    return NextResponse.json([])
  }
}

// POST: Generate weekly highlights (called by cron or admin)
export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminSupabaseClient()
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekStart = weekAgo.toISOString().split('T')[0]

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('is_active', true)

  if (!orgs) return NextResponse.json({ error: 'No orgs' }, { status: 500 })

  const results = []

  for (const org of orgs) {
    // Count questions
    const { count: totalQ } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .eq('role', 'user')
      .gte('created_at', weekAgo.toISOString())

    if (!totalQ || totalQ === 0) continue

    // Answer rate
    const { count: answered } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', org.id)
      .eq('role', 'assistant')
      .eq('answer_found', true)
      .gte('created_at', weekAgo.toISOString())

    // Unique visitors
    const { data: sessions } = await supabase
      .from('page_views')
      .select('session_id')
      .eq('org_id', org.id)
      .gte('created_at', weekAgo.toISOString())

    const uniqueVisitors = new Set(sessions?.map((s) => s.session_id).filter(Boolean)).size

    // Interesting questions
    const { data: interesting } = await supabase
      .from('messages')
      .select('content, topic_tags')
      .eq('org_id', org.id)
      .eq('role', 'assistant')
      .eq('classification', 'interesting')
      .gte('created_at', weekAgo.toISOString())
      .limit(10)

    // Topic tags
    const allTags: string[] = []
    interesting?.forEach((m) => {
      if (m.topic_tags) allTags.push(...m.topic_tags)
    })
    const tagCounts = new Map<string, number>()
    allTags.forEach((t) => tagCounts.set(t, (tagCounts.get(t) || 0) + 1))
    const topTopics = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic)

    // Get interesting user questions (not assistant answers)
    const { data: interestingUserQs } = await supabase
      .from('messages')
      .select('content')
      .eq('org_id', org.id)
      .eq('role', 'user')
      .gte('created_at', weekAgo.toISOString())
      .limit(50)

    // Just take the first 5 user questions that aren't super short
    const interestingQuestions = (interestingUserQs || [])
      .filter((m) => m.content.length > 20)
      .slice(0, 5)
      .map((m) => m.content)

    const answerRate = totalQ > 0 ? Math.round(((answered || 0) / totalQ) * 100) : 0

    // Upsert highlight
    await supabase.from('weekly_highlights').upsert(
      {
        org_id: org.id,
        week_start: weekStart,
        total_questions: totalQ,
        unique_visitors: uniqueVisitors,
        answer_rate: answerRate,
        top_topics: topTopics,
        interesting_questions: interestingQuestions,
      },
      { onConflict: 'org_id,week_start' }
    )

    results.push({ org: org.name, totalQ, answerRate, uniqueVisitors })
  }

  return NextResponse.json({ success: true, highlights: results })
}
