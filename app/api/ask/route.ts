import { NextRequest, NextResponse } from 'next/server'
import { answerQuestion } from '@/lib/ai/rag'
import { classifyQuestion } from '@/lib/ai/classify'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { logEvent } from '@/lib/analytics'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { getGeoFromHeaders } from '@/lib/geo'
import { askSchema } from '@/lib/validations'

export async function POST(req: NextRequest) {
  // Verify cricket quiz token
  const verificationToken = req.headers.get('x-cricket-verified')
  if (!verificationToken) {
    return NextResponse.json(
      { error: 'Please complete the cricket quiz first.' },
      { status: 403 }
    )
  }

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

  // Get visitor geolocation from headers
  const geo = getGeoFromHeaders(req.headers)

  try {
    const result = await answerQuestion(
      question,
      orgId,
      orgName,
      conversationHistory
    )
    const supabase = createAdminSupabaseClient()

    // Store user message with geo
    if (sessionId) {
      await supabase.from('messages').insert({
        session_id: sessionId,
        org_id: orgId,
        role: 'user',
        content: question,
        visitor_city: geo.city,
        visitor_province: geo.province,
        visitor_country: geo.country,
      })

      // Classify question in background (don't block response)
      classifyQuestion(question, result.answer, orgName).then(
        async (classification) => {
          await supabase.from('messages').insert({
            session_id: sessionId,
            org_id: orgId,
            role: 'assistant',
            content: result.answer,
            answer_found: result.found,
            cited_chunks: result.citations.map((c) => c.chunkId),
            classification: classification.classification,
            topic_tags: classification.topics,
          })
        }
      ).catch(async () => {
        // Fallback: store without classification
        await supabase.from('messages').insert({
          session_id: sessionId,
          org_id: orgId,
          role: 'assistant',
          content: result.answer,
          answer_found: result.found,
          cited_chunks: result.citations.map((c) => c.chunkId),
        })
      })
    }

    // Log analytics with geo
    await logEvent(
      result.found ? 'answer_found' : 'answer_not_found',
      orgId,
      sessionId,
      {
        question_length: question.length,
        city: geo.city,
        province: geo.province,
        country: geo.country,
      }
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
