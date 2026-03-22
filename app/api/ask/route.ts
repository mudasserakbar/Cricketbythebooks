import { NextRequest, NextResponse } from 'next/server'
import { answerQuestion } from '@/lib/ai/rag'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { logEvent } from '@/lib/analytics'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { askSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  // Rate limit: 20 questions per hour per IP
  const ip = getRateLimitKey(req)
  const limit = rateLimit(`ask:${ip}`, 20, 60 * 60 * 1000)
  if (!limit.success) {
    return NextResponse.json(
      { error: 'Too many questions. Please try again later.' },
      { status: 429 }
    )
  }

  const body = await req.json()
  const parsed = askSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid request', details: parsed.error.issues },
      { status: 400 }
    )
  }

  const { question, orgId, orgName, sessionId, conversationHistory } =
    parsed.data

  try {
    const result = await answerQuestion(
      question,
      orgId,
      orgName,
      conversationHistory
    )
    const supabase = createAdminSupabaseClient()

    // Store messages
    if (sessionId) {
      await supabase.from('messages').insert({
        session_id: sessionId,
        org_id: orgId,
        role: 'user',
        content: question,
      })
      await supabase.from('messages').insert({
        session_id: sessionId,
        org_id: orgId,
        role: 'assistant',
        content: result.answer,
        answer_found: result.found,
        cited_chunks: result.citations.map((c) => c.chunkId),
      })
    }

    // Log analytics
    await logEvent(
      result.found ? 'answer_found' : 'answer_not_found',
      orgId,
      sessionId,
      { question_length: question.length }
    )

    return NextResponse.json(result)
  } catch (err) {
    console.error('Ask error:', err)
    return NextResponse.json(
      { error: 'Failed to generate answer' },
      { status: 500 }
    )
  }
}
