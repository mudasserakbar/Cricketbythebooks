import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { logEvent } from '@/lib/analytics'
import { feedbackSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const parsed = feedbackSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { messageId, sessionId, helpful } = parsed.data
  const supabase = createAdminSupabaseClient()

  await supabase.from('message_feedback').insert({
    message_id: messageId,
    session_id: sessionId,
    helpful,
  })

  await logEvent(
    helpful ? 'feedback_helpful' : 'feedback_not_helpful',
    undefined,
    sessionId,
    { message_id: messageId }
  )

  return NextResponse.json({ success: true })
}
