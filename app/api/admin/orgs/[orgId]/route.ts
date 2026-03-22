import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', params.orgId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const body = await req.json()
  const supabase = createAdminSupabaseClient()

  const { data, error } = await supabase
    .from('organizations')
    .update(body)
    .eq('id', params.orgId)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { orgId: string } }
) {
  const supabase = createAdminSupabaseClient()
  const { error } = await supabase
    .from('organizations')
    .delete()
    .eq('id', params.orgId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
