import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { getGeoFromHeaders } from '@/lib/geo'

// Track page views with geolocation
export async function POST(req: NextRequest) {
  const { page, orgId, sessionId } = await req.json()
  const geo = getGeoFromHeaders(req.headers)

  try {
    const supabase = createAdminSupabaseClient()
    await supabase.from('page_views').insert({
      page: page || '/',
      org_id: orgId || null,
      session_id: sessionId || null,
      city: geo.city,
      province: geo.province,
      country: geo.country,
    })
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // Silent fail
  }
}
