import { createClientSupabaseClient } from './supabase/client'

export async function getOrCreateSession(orgId: string): Promise<string> {
  const key = `session_${orgId}`
  const existing = localStorage.getItem(key)
  if (existing) return existing

  const supabase = createClientSupabaseClient()
  const { data } = await supabase
    .from('sessions')
    .insert({ org_id: orgId })
    .select()
    .single()

  if (data) {
    localStorage.setItem(key, data.id)
    return data.id
  }

  // Fallback: generate a local ID
  const fallbackId = crypto.randomUUID()
  localStorage.setItem(key, fallbackId)
  return fallbackId
}
