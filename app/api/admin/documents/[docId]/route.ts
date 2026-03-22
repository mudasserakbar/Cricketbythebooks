import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: { docId: string } }
) {
  const supabase = createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('documents')
    .select('*, organizations(name)')
    .eq('id', params.docId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }

  // Get chunk count
  const { count } = await supabase
    .from('document_chunks')
    .select('*', { count: 'exact', head: true })
    .eq('document_id', params.docId)

  return NextResponse.json({ ...data, chunk_count: count })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { docId: string } }
) {
  const supabase = createAdminSupabaseClient()

  // Get file path for storage cleanup
  const { data: doc } = await supabase
    .from('documents')
    .select('file_path')
    .eq('id', params.docId)
    .single()

  if (doc?.file_path) {
    await supabase.storage.from('documents').remove([doc.file_path])
  }

  // Delete document (cascades to chunks)
  const { error } = await supabase
    .from('documents')
    .delete()
    .eq('id', params.docId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
