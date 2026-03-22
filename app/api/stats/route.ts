import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Public stats — no auth required
export async function GET() {
  try {
    const supabase = createAdminSupabaseClient()

    // Total questions answered
    const { count: totalAnswered } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'assistant')
      .eq('answer_found', true)

    // Total unique sessions
    const { count: totalSessions } = await supabase
      .from('sessions')
      .select('*', { count: 'exact', head: true })

    // Total organizations active
    const { count: activeOrgs } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Total documents loaded
    const { count: totalDocs } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true })
      .eq('processed', true)

    // Questions this week
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const { count: questionsThisWeek } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'user')
      .gte('created_at', weekAgo.toISOString())

    // Visitor provinces (top 5)
    const { data: provinceData } = await supabase
      .from('page_views')
      .select('province')
      .not('province', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1000)

    const provinceCounts = new Map<string, number>()
    provinceData?.forEach((pv) => {
      if (pv.province) {
        provinceCounts.set(pv.province, (provinceCounts.get(pv.province) || 0) + 1)
      }
    })
    const topProvinces = Array.from(provinceCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([province, count]) => ({ province, count }))

    // Peak usage hours (last 30 days)
    const { data: hourData } = await supabase
      .from('messages')
      .select('created_at')
      .eq('role', 'user')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .limit(2000)

    const hourCounts = new Array(24).fill(0)
    hourData?.forEach((m) => {
      const hour = new Date(m.created_at).getHours()
      hourCounts[hour]++
    })

    return NextResponse.json({
      totalAnswered: totalAnswered || 0,
      totalSessions: totalSessions || 0,
      activeOrgs: activeOrgs || 0,
      totalDocs: totalDocs || 0,
      questionsThisWeek: questionsThisWeek || 0,
      topProvinces,
      peakHours: hourCounts,
    })
  } catch {
    return NextResponse.json({
      totalAnswered: 0,
      totalSessions: 0,
      activeOrgs: 0,
      totalDocs: 0,
      questionsThisWeek: 0,
      topProvinces: [],
      peakHours: new Array(24).fill(0),
    })
  }
}
