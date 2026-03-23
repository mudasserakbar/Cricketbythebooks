// Voyage AI embeddings (voyage-3, 1024 dims)
// Must match the model used in the seed script

export async function embedText(text: string): Promise<string> {
  const embeddings = await embedTexts([text])
  // Return as string format for pgvector RPC compatibility
  return '[' + embeddings[0].join(',') + ']'
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []

  const apiKey = process.env.VOYAGE_API_KEY
  if (!apiKey) {
    throw new Error('VOYAGE_API_KEY is not set')
  }

  const res = await fetch('https://api.voyageai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'voyage-3',
      input: texts,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Voyage API error: ${res.status} ${err}`)
  }

  const data = await res.json()
  return data.data.map((d: { embedding: number[] }) => d.embedding)
}
