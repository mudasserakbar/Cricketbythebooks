import { createAdminSupabaseClient } from './supabase/admin'

export async function logEvent(
  eventType: string,
  orgId?: string,
  sessionId?: string,
  metadata?: Record<string, unknown>
) {
  try {
    const supabase = createAdminSupabaseClient()
    await supabase.from('analytics_events').insert({
      event_type: eventType,
      org_id: orgId,
      session_id: sessionId,
      metadata,
    })
  } catch {
    // Silent fail — never break the user experience for analytics
  }
}
