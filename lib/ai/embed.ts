import OpenAI from 'openai'

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export async function embedText(text: string): Promise<number[]> {
  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const response = await getOpenAI().embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  })

  return response.data
    .sort((a, b) => a.index - b.index)
    .map((d) => d.embedding)
}
