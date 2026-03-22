import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const orgId = req.nextUrl.searchParams.get('orgId')
  if (!orgId) {
    return NextResponse.json({ error: 'orgId required' }, { status: 400 })
  }

  try {
    const supabase = createAdminSupabaseClient()
    const { data } = await supabase
      .from('documents')
      .select('id, name, type, version, created_at')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .eq('processed', true)
      .order('name')

    return NextResponse.json({ documents: data || [], count: data?.length || 0 })
  } catch {
    return NextResponse.json({ documents: [], count: 0 })
  }
}
