import Anthropic from '@anthropic-ai/sdk'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { embedText } from './embed'
import type { RAGResult, Citation } from '@/lib/types'

function getAnthropic() {
  return new Anthropic()
}

export async function answerQuestion(
  question: string,
  orgId: string,
  orgName: string,
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<RAGResult> {
  const supabase = createAdminSupabaseClient()

  // 1. Embed the question
  const queryEmbedding = await embedText(question)

  // 2. Vector search for relevant chunks
  const { data: chunks, error } = await supabase.rpc('match_chunks', {
    query_embedding: queryEmbedding,
    match_org_id: orgId,
    match_threshold: 0.72,
    match_count: 6,
  })

  if (error) throw error

  // 3. If no relevant chunks found
  if (!chunks || chunks.length === 0) {
    return {
      answer: `This topic doesn't appear to be covered in ${orgName}'s current policy documents. You may want to contact the organization directly or try rephrasing your question.`,
      found: false,
      citations: [],
    }
  }

  // 4. Build context from chunks
  const context = chunks
    .map(
      (c: Record<string, unknown>, i: number) =>
        `[Source ${i + 1}: ${c.document_name}, ${c.section_reference || 'General'}]\n${c.content}`
    )
    .join('\n\n---\n\n')

  // 5. Detect if Quebec org for bilingual support
  const isQuebec = orgName.toLowerCase().includes('quebec')
  const langRule = isQuebec
    ? `- If the user writes in French, respond in French. If in English, respond in English. You are bilingual.`
    : ''

  // 6. Generate answer with Claude
  const systemPrompt = `You are a helpful policy assistant for ${orgName}, a Canadian cricket organization.

Your job is to answer questions using ONLY the provided policy document excerpts below.

Rules:
- Answer in plain, clear language suitable for players, coaches, managers, and parents
- Only use information from the provided document excerpts
- Always end your answer by specifying which source(s) you used, in the format: "📄 Source: [Document Name], [Section Reference]"
- If the excerpts don't fully answer the question, say so clearly and only answer what IS covered
- Never make up rules or infer beyond what is written
- Keep answers concise — 2 to 5 sentences unless the question requires more detail
- Do not give legal advice; if a matter is serious (suspension, legal dispute), note that the user should seek proper guidance
${langRule}

Policy documents for ${orgName}:
${context}`

  const messages: Anthropic.MessageParam[] = [
    ...conversationHistory.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: question },
  ]

  const response = await getAnthropic().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  })

  const answerText =
    response.content[0].type === 'text' ? response.content[0].text : ''

  // 6. Build citations from used chunks
  const citations: Citation[] = chunks.map((c: Record<string, unknown>) => ({
    documentName: c.document_name as string,
    documentType: c.document_type as string,
    sectionReference: c.section_reference as string | undefined,
    chunkContent: c.content as string,
    chunkId: c.id as string,
  }))

  return {
    answer: answerText,
    found: true,
    citations,
  }
}
