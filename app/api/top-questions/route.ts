import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('orgId')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '5')

  try {
    const supabase = createAdminSupabaseClient()

    // Get most-asked questions from recent messages
    // Group user questions by similarity (simple: exact match for now)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let query = supabase
      .from('messages')
      .select('content, org_id')
      .eq('role', 'user')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(500)

    if (orgId) {
      query = query.eq('org_id', orgId)
    }

    const { data: messages } = await query

    if (!messages || messages.length === 0) {
      return NextResponse.json({ questions: [] })
    }

    // Count question frequency (normalize by lowercasing and trimming)
    const counts = new Map<string, { question: string; count: number }>()
    for (const msg of messages) {
      const normalized = msg.content.toLowerCase().trim().replace(/[?.!]+$/, '')
      const existing = counts.get(normalized)
      if (existing) {
        existing.count++
      } else {
        counts.set(normalized, { question: msg.content, count: 1 })
      }
    }

    // Sort by frequency and take top N
    const sorted = Array.from(counts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
      .map((q) => ({
        question: q.question,
        askCount: q.count,
      }))

    return NextResponse.json({ questions: sorted })
  } catch {
    return NextResponse.json({ questions: [] })
  }
}
