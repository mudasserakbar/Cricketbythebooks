import { NextRequest, NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase/admin'
import { chunkDocument } from '@/lib/ai/chunk'
import { embedTexts } from '@/lib/ai/embed'
import { uploadSchema } from '@/lib/validations'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse')

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46] // %PDF

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB.` },
        { status: 400 }
      )
    }

    // Validate form fields
    const parsed = uploadSchema.safeParse({
      orgId: formData.get('orgId'),
      name: formData.get('name'),
      type: formData.get('type'),
      version: formData.get('version') || undefined,
    })

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid form data', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const { orgId, name: docName, type: docType, version } = parsed.data

    // Validate PDF magic bytes
    const buffer = Buffer.from(await file.arrayBuffer())
    const isPdf = PDF_MAGIC.every((byte, i) => buffer[i] === byte)
    if (!isPdf) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are accepted.' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()

    // 1. Upload file to Supabase Storage
    const filePath = `${orgId}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, buffer, { contentType: 'application/pdf' })

    if (uploadError) throw uploadError

    // 2. Create document record
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        org_id: orgId,
        name: docName,
        type: docType,
        version: version || null,
        file_path: filePath,
        file_size: file.size,
      })
      .select()
      .single()

    if (docError) throw docError

    try {
      // 3. Extract text from PDF
      const parsed = await pdfParse(buffer)
      const text = parsed.text

      if (!text || text.trim().length < 10) {
        throw new Error('PDF contains no extractable text. It may be image-based.')
      }

      // 4. Chunk the document
      const chunks = await chunkDocument(text)

      // 5. Generate embeddings in batches of 20
      const batchSize = 20
      let totalChunks = 0

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize)
        const embeddings = await embedTexts(batch.map((c) => c.content))

        const { error: insertError } = await supabase
          .from('document_chunks')
          .insert(
            batch.map((chunk, j) => ({
              document_id: doc.id,
              org_id: orgId,
              content: chunk.content,
              chunk_index: chunk.chunkIndex,
              section_reference: chunk.sectionReference || null,
              page_number: chunk.pageNumber || null,
              embedding: embeddings[j],
            }))
          )

        if (insertError) throw insertError
        totalChunks += batch.length
      }

      // 6. Mark document as processed
      await supabase
        .from('documents')
        .update({ processed: true })
        .eq('id', doc.id)

      return NextResponse.json({
        success: true,
        documentId: doc.id,
        chunksCreated: totalChunks,
      })
    } catch (processErr) {
      // Mark document as failed, but don't delete — admin can retry
      await supabase
        .from('documents')
        .update({ processed: false })
        .eq('id', doc.id)

      console.error('Processing error:', processErr)
      return NextResponse.json(
        {
          error:
            processErr instanceof Error
              ? processErr.message
              : 'Failed to process document',
          documentId: doc.id,
        },
        { status: 500 }
      )
    }
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    )
  }
}
