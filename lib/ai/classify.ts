import Anthropic from '@anthropic-ai/sdk'

function getAnthropic() {
  return new Anthropic()
}

export interface QuestionClassification {
  classification: 'interesting' | 'routine'
  topics: string[]
  reason: string
}

// Classify a question as interesting or routine using Claude Haiku (fast + cheap)
export async function classifyQuestion(
  question: string,
  answer: string,
  orgName: string
): Promise<QuestionClassification> {
  try {
    const response = await getAnthropic().messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 200,
      system: `You classify cricket policy questions as "interesting" or "routine" for ${orgName}.

INTERESTING: Unusual situations, edge cases, multi-team disputes, eligibility conflicts, disciplinary gray areas, cross-province issues, questions that reveal policy gaps, questions other organizations should know about.

ROUTINE: Standard registration, basic eligibility checks, simple rule lookups, how-to questions, contact information, fee inquiries.

Respond ONLY with JSON: {"classification":"interesting"|"routine","topics":["tag1","tag2"],"reason":"one sentence"}`,
      messages: [
        {
          role: 'user',
          content: `Question: "${question}"\nAnswer summary: "${answer.slice(0, 200)}"`,
        },
      ],
    })

    const text =
      response.content[0].type === 'text' ? response.content[0].text : '{}'
    const parsed = JSON.parse(text)

    return {
      classification: parsed.classification === 'interesting' ? 'interesting' : 'routine',
      topics: Array.isArray(parsed.topics) ? parsed.topics.slice(0, 5) : [],
      reason: parsed.reason || '',
    }
  } catch {
    // Fallback: classify based on question length and keywords
    const interestingKeywords = [
      'suspend', 'appeal', 'transfer', 'dispute', 'two teams', 'both',
      'exception', 'waiver', 'overseas', 'international', 'ban', 'protest',
      'conflict', 'unfair', 'discrimination',
    ]
    const isInteresting = interestingKeywords.some((kw) =>
      question.toLowerCase().includes(kw)
    )

    return {
      classification: isInteresting ? 'interesting' : 'routine',
      topics: [],
      reason: 'Classified by keyword fallback',
    }
  }
}
