import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const supabase = createAdminSupabaseClient()
  const orgId = req.nextUrl.searchParams.get('orgId')
  const days = parseInt(req.nextUrl.searchParams.get('days') || '30')

  const since = new Date()
  since.setDate(since.getDate() - days)

  // Total questions
  let questionsQuery = supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .in('event_type', ['answer_found', 'answer_not_found'])
    .gte('created_at', since.toISOString())

  if (orgId) questionsQuery = questionsQuery.eq('org_id', orgId)
  const { count: totalQuestions } = await questionsQuery

  // Answers found
  let foundQuery = supabase
    .from('analytics_events')
    .select('*', { count: 'exact', head: true })
    .eq('event_type', 'answer_found')
    .gte('created_at', since.toISOString())

  if (orgId) foundQuery = foundQuery.eq('org_id', orgId)
  const { count: answersFound } = await foundQuery

  // Unique sessions
  let sessionsQuery = supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', since.toISOString())

  if (orgId) sessionsQuery = sessionsQuery.eq('org_id', orgId)
  const { count: totalSessions } = await sessionsQuery

  // Support requests
  let supportQuery = supabase
    .from('support_requests')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', since.toISOString())

  if (orgId) supportQuery = supportQuery.eq('org_id', orgId)
  const { count: supportRequests } = await supportQuery

  // Recent events
  let recentQuery = supabase
    .from('analytics_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  if (orgId) recentQuery = recentQuery.eq('org_id', orgId)
  const { data: recentEvents } = await recentQuery

  const answerRate =
    totalQuestions && totalQuestions > 0
      ? Math.round(((answersFound || 0) / totalQuestions) * 100)
      : 0

  return NextResponse.json({
    totalQuestions: totalQuestions || 0,
    answersFound: answersFound || 0,
    answerRate,
    totalSessions: totalSessions || 0,
    supportRequests: supportRequests || 0,
    recentEvents: recentEvents || [],
  })
}
