/**
 * Retry script: embed unprocessed documents that were uploaded but not embedded
 * Handles Voyage AI rate limits (3 RPM on free tier) with 25s delays
 *
 * Usage: npx tsx scripts/retry-embeddings.ts
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
const VOYAGE_KEY = process.env.VOYAGE_API_KEY!

// ── Chunking ────────────────────────────────────────────────────

function chunkText(text: string) {
  const chunkSize = 800
  const overlap = 150
  const chunks: { content: string; chunkIndex: number; sectionReference?: string }[] = []
  const cleaned = text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  const paragraphs = cleaned.split(/\n\n+/)
  let current = ''
  let chunkIndex = 0

  for (const para of paragraphs) {
    if (current.length + para.length > chunkSize && current.length > 0) {
      const ref = current.match(/\b(Section|Article|Clause|Rule|Regulation|Part)\s+[\d.]+/i)
      chunks.push({ content: current.trim(), chunkIndex: chunkIndex++, sectionReference: ref?.[0] })
      const words = current.split(' ')
      const ow: string[] = []
      let ol = 0
      for (let i = words.length - 1; i >= 0 && ol < overlap; i--) { ow.unshift(words[i]); ol += words[i].length + 1 }
      current = ow.join(' ') + ' ' + para
    } else {
      current = current ? current + '\n\n' + para : para
    }
  }
  if (current.trim()) {
    const ref = current.match(/\b(Section|Article|Clause|Rule|Regulation|Part)\s+[\d.]+/i)
    chunks.push({ content: current.trim(), chunkIndex, sectionReference: ref?.[0] })
  }
  return chunks
}

// ── Embed with retry ────────────────────────────────────────────

async function embed(texts: string[]): Promise<number[][]> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${VOYAGE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'voyage-3', input: texts }),
    })
    if (res.ok) {
      const data = await res.json()
      return data.data.map((d: any) => d.embedding)
    }
    if (res.status === 429) {
      const wait = 22
      console.log(`    Rate limited, waiting ${wait}s (attempt ${attempt + 1}/8)...`)
      await new Promise(r => setTimeout(r, wait * 1000))
      continue
    }
    throw new Error(`Voyage error: ${res.status}`)
  }
  throw new Error('Exceeded retries')
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  // Get all unprocessed documents
  const { data: docs } = await supabase
    .from('documents')
    .select('id, name, org_id, file_path')
    .eq('processed', false)
    .order('name')

  if (!docs || docs.length === 0) {
    console.log('All documents are already processed!')
    return
  }

  console.log(`Found ${docs.length} unprocessed documents\n`)

  let done = 0
  let failed = 0

  for (const doc of docs) {
    console.log(`[${done + failed + 1}/${docs.length}] ${doc.name}`)

    // Check if chunks already exist (partial run)
    const { count } = await supabase
      .from('document_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('document_id', doc.id)

    if (count && count > 0) {
      console.log(`  Already has ${count} chunks, marking processed`)
      await supabase.from('documents').update({ processed: true }).eq('id', doc.id)
      done++
      continue
    }

    // Download the file from storage
    const { data: fileData, error: dlErr } = await supabase.storage
      .from('documents')
      .download(doc.file_path)

    if (dlErr || !fileData) {
      console.log(`  Failed to download: ${dlErr?.message}`)
      failed++
      continue
    }

    // Parse PDF
    const buffer = Buffer.from(await fileData.arrayBuffer())
    let text: string
    try {
      const pdf = require('pdf-parse')
      const parsed = await pdf(buffer)
      text = parsed.text.trim()

      // OCR fallback
      if (text.length < 100) {
        const { execSync } = require('child_process')
        const fs = require('fs')
        const tmpDir = fs.mkdtempSync('/tmp/ocr-')
        const tmpPdf = `${tmpDir}/doc.pdf`
        fs.writeFileSync(tmpPdf, buffer)
        try {
          execSync(`pdftoppm -png "${tmpPdf}" "${tmpDir}/page"`, { timeout: 60000 })
          const pages = fs.readdirSync(tmpDir).filter((f: string) => f.endsWith('.png')).sort()
          text = ''
          for (const page of pages) {
            text += execSync(`tesseract "${tmpDir}/${page}" stdout 2>/dev/null`, { timeout: 30000 }).toString() + '\n\n'
          }
          text = text.trim()
          console.log(`  OCR: ${text.length} chars`)
        } finally {
          fs.rmSync(tmpDir, { recursive: true, force: true })
        }
      }
    } catch (e: any) {
      console.log(`  Parse error: ${e.message}`)
      failed++
      continue
    }

    if (text.length < 50) {
      console.log(`  Too little text (${text.length} chars), skipping`)
      failed++
      continue
    }

    // Chunk
    const chunks = chunkText(text)
    console.log(`  ${chunks.length} chunks, embedding...`)

    // Embed in batches
    const batchSize = 3 // very small batches to stay under 10K TPM free tier
    const allRecords: any[] = []

    try {
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize)
        const embeddings = await embed(batch.map(c => c.content))

        allRecords.push(...batch.map((chunk, j) => ({
          document_id: doc.id,
          org_id: doc.org_id,
          content: chunk.content,
          chunk_index: chunk.chunkIndex,
          section_reference: chunk.sectionReference || null,
          page_number: null,
          embedding: embeddings[j],
        })))

        // Always wait between batches to respect 3 RPM + 10K TPM
        if (i + batchSize < chunks.length) {
          console.log(`    Waiting 25s for rate limit...`)
          await new Promise(r => setTimeout(r, 25000))
        }
      }

      // Insert chunks
      const { error: insertErr } = await supabase
        .from('document_chunks')
        .insert(allRecords)

      if (insertErr) {
        console.log(`  Insert error: ${insertErr.message}`)
        failed++
        continue
      }

      // Mark processed
      await supabase.from('documents').update({ processed: true }).eq('id', doc.id)
      done++
      console.log(`  Done! ${chunks.length} chunks`)

      // Wait between documents
      console.log(`  Waiting 30s before next doc...`)
      await new Promise(r => setTimeout(r, 30000))
    } catch (e: any) {
      console.log(`  Embedding failed: ${e.message}`)
      failed++
    }
  }

  console.log(`\n${'='.repeat(50)}`)
  console.log(`Done: ${done}, Failed: ${failed}, Total: ${docs.length}`)
}

main().catch(console.error)
