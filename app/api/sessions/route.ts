import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Get conversation history for an org (by session IDs stored in client)
export async function POST(req: NextRequest) {
  const { sessionIds } = await req.json()

  if (!sessionIds || !Array.isArray(sessionIds) || sessionIds.length === 0) {
    return NextResponse.json({ sessions: [] })
  }

  try {
    const supabase = createAdminSupabaseClient()

    // Get sessions with their first user message as title
    const { data: sessions } = await supabase
      .from('sessions')
      .select('id, org_id, created_at, title, last_active_at')
      .in('id', sessionIds.slice(0, 20))
      .order('created_at', { ascending: false })

    if (!sessions || sessions.length === 0) {
      return NextResponse.json({ sessions: [] })
    }

    // For sessions without a title, get the first user message
    const needsTitle = sessions.filter((s) => !s.title).map((s) => s.id)
    if (needsTitle.length > 0) {
      const { data: messages } = await supabase
        .from('messages')
        .select('session_id, content')
        .in('session_id', needsTitle)
        .eq('role', 'user')
        .order('created_at', { ascending: true })

      const titleMap = new Map<string, string>()
      messages?.forEach((m) => {
        if (!titleMap.has(m.session_id)) {
          titleMap.set(
            m.session_id,
            m.content.length > 60 ? m.content.slice(0, 60) + '...' : m.content
          )
        }
      })

      sessions.forEach((s) => {
        if (!s.title && titleMap.has(s.id)) {
          s.title = titleMap.get(s.id)!
        }
      })
    }

    return NextResponse.json({ sessions })
  } catch {
    return NextResponse.json({ sessions: [] })
  }
}
