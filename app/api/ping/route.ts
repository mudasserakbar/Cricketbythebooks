import { NextResponse } from 'next/server'

export async function GET() {
  const results: Record<string, string> = {}

  // Test Voyage AI
  try {
    const r = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.VOYAGE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'voyage-3', input: ['test'] }),
      signal: AbortSignal.timeout(10000),
    })
    results.voyage = r.ok ? `ok-${r.status}` : `error-${r.status}`
  } catch (e: any) {
    results.voyage = `fail: ${e?.message} / cause: ${e?.cause}`
  }

  // Test Anthropic
  try {
    const r = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      signal: AbortSignal.timeout(10000),
    })
    results.anthropic = r.ok ? `ok-${r.status}` : `error-${r.status}`
  } catch (e: any) {
    results.anthropic = `fail: ${e?.message} / cause: ${e?.cause}`
  }

  // Test Supabase
  try {
    const r = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      headers: { 'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! },
      signal: AbortSignal.timeout(10000),
    })
    results.supabase = r.ok ? `ok-${r.status}` : `error-${r.status}`
  } catch (e: any) {
    results.supabase = `fail: ${e?.message}`
  }

  return NextResponse.json(results)
}
