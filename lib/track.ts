// Client-side analytics event tracking
// Uses the Supabase client directly to avoid an extra API round-trip

import { createClientSupabaseClient } from './supabase/client'

export function track(
  eventType: string,
  orgId?: string,
  sessionId?: string,
  metadata?: Record<string, unknown>
) {
  try {
    const supabase = createClientSupabaseClient()
    supabase
      .from('analytics_events')
      .insert({
        event_type: eventType,
        org_id: orgId || null,
        session_id: sessionId || null,
        metadata: metadata || null,
      })
      .then(() => {})
  } catch {
    // Silent fail — never break UX for analytics
  }
}
