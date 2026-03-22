import { NextRequest } from 'next/server'
import { createAnthropic } from '@ai-sdk/anthropic'
import { streamText } from 'ai'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { embedText } from '@/lib/ai/embed'
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit'
import { askSchema } from '@/lib/validations'

const anthropic = createAnthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = getRateLimitKey(req)
  const limit = rateLimit(`ask:${ip}`, 20, 60 * 60 * 1000)
  if (!limit.success) {
    return new Response('Too many questions. Please try again later.', { status: 429 })
  }

  const body = await req.json()
  const parsed = askSchema.safeParse(body)
  if (!parsed.success) {
    return new Response('Invalid request', { status: 400 })
  }

  const { question, orgId, orgName, conversationHistory } = parsed.data

  try {
    const supabase = createAdminSupabaseClient()

    // Embed question and search
    const queryEmbedding = await embedText(question)
    const { data: chunks } = await supabase.rpc('match_chunks', {
      query_embedding: queryEmbedding,
      match_org_id: orgId,
      match_threshold: 0.72,
      match_count: 6,
    })

    if (!chunks || chunks.length === 0) {
      return new Response(
        `This topic doesn't appear to be covered in ${orgName}'s current policy documents. You may want to contact the organization directly or try rephrasing your question.`,
        { status: 200 }
      )
    }

    const context = chunks
      .map(
        (c: Record<string, unknown>, i: number) =>
          `[Source ${i + 1}: ${c.document_name}, ${c.section_reference || 'General'}]\n${c.content}`
      )
      .join('\n\n---\n\n')

    const isQuebec = orgName.toLowerCase().includes('quebec')
    const langRule = isQuebec
      ? `\n- If the user writes in French, respond in French. If in English, respond in English. You are bilingual.`
      : ''

    const systemPrompt = `You are a helpful policy assistant for ${orgName}, a Canadian cricket organization.

Your job is to answer questions using ONLY the provided policy document excerpts below.

Rules:
- Answer in plain, clear language suitable for players, coaches, managers, and parents
- Only use information from the provided document excerpts
- Always end your answer by specifying which source(s) you used, in the format: "📄 Source: [Document Name], [Section Reference]"
- If the excerpts don't fully answer the question, say so clearly and only answer what IS covered
- Never make up rules or infer beyond what is written
- Keep answers concise — 2 to 5 sentences unless the question requires more detail
- Do not give legal advice; if a matter is serious (suspension, legal dispute), note that the user should seek proper guidance${langRule}

Policy documents for ${orgName}:
${context}`

    const messages = [
      ...(conversationHistory || []).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: question },
    ]

    const result = streamText({
      model: anthropic('claude-sonnet-4-20250514'),
      system: systemPrompt,
      messages,
      maxOutputTokens: 1024,
    })

    return result.toTextStreamResponse()
  } catch (err) {
    console.error('Stream error:', err)
    return new Response('Failed to generate answer', { status: 500 })
  }
}
