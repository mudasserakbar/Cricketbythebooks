/**
 * Seed Script: Process and upload all Cricket Canada policy documents
 *
 * Usage:
 *   npx tsx scripts/seed-documents.ts
 *
 * Requirements:
 *   - Supabase project configured with migration applied
 *   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - VOYAGE_API_KEY or OPENAI_API_KEY in .env.local
 *   - PDF files in ~/Desktop/cricket canada documents/
 *
 * What it does:
 *   1. Reads each PDF from the source directory
 *   2. Extracts text via pdf-parse
 *   3. Chunks text into ~800 char segments with overlap
 *   4. Generates vector embeddings for each chunk
 *   5. Uploads file to Supabase Storage
 *   6. Creates document + chunk records in Supabase
 */

import { createClient } from '@supabase/supabase-js'
import pdf from 'pdf-parse'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'
import dotenv from 'dotenv'

// Load env
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const VOYAGE_KEY = process.env.VOYAGE_API_KEY
const OPENAI_KEY = process.env.OPENAI_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

if (!VOYAGE_KEY && !OPENAI_KEY) {
  console.error('Missing VOYAGE_API_KEY or OPENAI_API_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const SOURCE_DIR = path.join(
  process.env.HOME || '/Users/buraq',
  'Desktop',
  'cricket canada documents'
)

// ── Document catalog ────────────────────────────────────────────
// Maps filenames to clean names + document types
// Duplicates (files with " (1)") are skipped

interface DocMeta {
  name: string
  type: 'bylaws' | 'playing_rules' | 'registration' | 'disciplinary' | 'other'
  version: string
}

const DOCUMENT_CATALOG: Record<string, DocMeta> = {
  'Cricket-Canada-bylaws-approved-MAy-11-2025.pdf': {
    name: 'Cricket Canada By-Laws (Approved May 2025)',
    type: 'bylaws',
    version: '2025',
  },
  '1_2.-cricket_canada_laws_french.pdf': {
    name: 'Lois du Cricket Canada (French)',
    type: 'playing_rules',
    version: '2025',
  },
  'CC-Selection-Policy-2025.pdf': {
    name: 'Player Selection Policy 2025',
    type: 'registration',
    version: '2025',
  },
  '2_2.CC-POL-001-Cricket-Canada-Code-of-Conduct-4.pdf': {
    name: 'Code of Conduct',
    type: 'disciplinary',
    version: 'CC-POL-001-v4',
  },
  '2_3.CC-POL-002-Discipline-Complaints-4.pdf': {
    name: 'Discipline & Complaints Policy',
    type: 'disciplinary',
    version: 'CC-POL-002-v4',
  },
  '2_4.CC-POL-003-Cricket-Canada-Board-of-Directors-Orientation-Policy-4.pdf': {
    name: 'Board of Directors Orientation Policy',
    type: 'other',
    version: 'CC-POL-003-v4',
  },
  '2_5.CC-POL-004-Cricket-Canada-By-Law-review-Policy-4.pdf': {
    name: 'By-Law Review Policy',
    type: 'bylaws',
    version: 'CC-POL-004-v4',
  },
  '2_6.CC-POL-005-Risk-Management-Policy-3.pdf': {
    name: 'Risk Management Policy',
    type: 'other',
    version: 'CC-POL-005-v3',
  },
  '2_7.CC-POL-006-Athlete-Centeredness-Policy-3.pdf': {
    name: 'Athlete Centeredness Policy',
    type: 'other',
    version: 'CC-POL-006-v3',
  },
  '2_8.CC-POL-007-Cricket-Canada-Equity-Policy-3.pdf': {
    name: 'Equity Policy',
    type: 'other',
    version: 'CC-POL-007-v3',
  },
  '2_9.CC-POL-008-Cricket-Canada-Gender-Equity-Policy-3.pdf': {
    name: 'Gender Equity Policy',
    type: 'other',
    version: 'CC-POL-008-v3',
  },
  '2_10.CC-POL-009-Cricket-Canada-Harassment-Policy-3.pdf': {
    name: 'Harassment Policy',
    type: 'disciplinary',
    version: 'CC-POL-009-v3',
  },
  '2_11.CC-POL-010-Cricket-Canada-Official-Languages-Policy-3.pdf': {
    name: 'Official Languages Policy',
    type: 'other',
    version: 'CC-POL-010-v3',
  },
  '2_12.CC-POL-011-Dispute-Resolution-and-Internal-Appeal-Policy-3.pdf': {
    name: 'Dispute Resolution & Internal Appeal Policy',
    type: 'disciplinary',
    version: 'CC-POL-011-v3',
  },
  '2_13.CC-POL-012-SanctionPolicy-3.pdf': {
    name: 'Sanction Policy',
    type: 'disciplinary',
    version: 'CC-POL-012-v3',
  },
  '2_14.CC-POL-013-Domestic-Events-Policy-3.pdf': {
    name: 'Domestic Events Policy',
    type: 'playing_rules',
    version: 'CC-POL-013-v3',
  },
  '2_15.CC-POL-015-Conflict-of-Interest-Policy-3.pdf': {
    name: 'Conflict of Interest Policy',
    type: 'other',
    version: 'CC-POL-015-v3',
  },
  '2_16.CC-POL-016-Financial-Controls-Policy-3.pdf': {
    name: 'Financial Controls Policy',
    type: 'other',
    version: 'CC-POL-016-v3',
  },
  '2_17.CC-POL-017-Travel-Policy-3.pdf': {
    name: 'Travel Policy',
    type: 'other',
    version: 'CC-POL-017-v3',
  },
  '2_18.CC-POL-018-Sponsorship-Policy-3.pdf': {
    name: 'Sponsorship Policy',
    type: 'other',
    version: 'CC-POL-018-v3',
  },
  '2_19.CC-POL-019-Development-Funding-Policy-3.pdf': {
    name: 'Development Funding Policy',
    type: 'other',
    version: 'CC-POL-019-v3',
  },
  '2_20.CC-POL-020-Committe-Policy-3.pdf': {
    name: 'Committee Policy',
    type: 'other',
    version: 'CC-POL-020-v3',
  },
  '2_21.CC-POL-021-HR-Policy-3.pdf': {
    name: 'Human Resources Policy',
    type: 'other',
    version: 'CC-POL-021-v3',
  },
  '2_22.CC-POL-022-Coach-and-Manger-Appointment-3.pdf': {
    name: 'Coach & Manager Appointment Policy',
    type: 'registration',
    version: 'CC-POL-022-v3',
  },
  '2_25.CC-POL-025-internal-audit-3.pdf': {
    name: 'Internal Audit Policy',
    type: 'other',
    version: 'CC-POL-025-v3',
  },
  '2_26.CC-POL-026-Disapproved-cricket-3.pdf': {
    name: 'Disapproved Cricket Policy',
    type: 'disciplinary',
    version: 'CC-POL-026-v3',
  },
}

// Skip duplicates
const SKIP_FILES = [
  '2_3.CC-POL-002-Discipline-Complaints-4 (1).pdf',
  '2_17.CC-POL-017-Travel-Policy-3 (1).pdf',
]

// ── OCR fallback for scanned/image PDFs ─────────────────────────

function ocrPdf(filePath: string): string {
  const tmpDir = fs.mkdtempSync('/tmp/ocr-')
  try {
    // Convert PDF pages to PNG images
    execSync(`pdftoppm -png "${filePath}" "${tmpDir}/page"`, { timeout: 60000 })
    const pages = fs.readdirSync(tmpDir)
      .filter(f => f.endsWith('.png'))
      .sort()

    let fullText = ''
    for (const page of pages) {
      const pageText = execSync(
        `tesseract "${tmpDir}/${page}" stdout 2>/dev/null`,
        { timeout: 30000 }
      ).toString()
      fullText += pageText + '\n\n'
    }
    return fullText.trim()
  } finally {
    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

// ── Chunking ────────────────────────────────────────────────────

interface Chunk {
  content: string
  chunkIndex: number
  sectionReference?: string
  pageNumber?: number
}

function chunkText(text: string): Chunk[] {
  const chunkSize = 800
  const overlap = 150
  const chunks: Chunk[] = []

  // Clean up the text
  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // Split by paragraphs first, then merge into chunks
  const paragraphs = cleaned.split(/\n\n+/)
  let current = ''
  let chunkIndex = 0

  for (const para of paragraphs) {
    if (current.length + para.length > chunkSize && current.length > 0) {
      chunks.push({
        content: current.trim(),
        chunkIndex: chunkIndex++,
        sectionReference: extractSectionRef(current),
      })
      // Keep overlap from end of previous chunk
      const words = current.split(' ')
      const overlapWords = []
      let overlapLen = 0
      for (let i = words.length - 1; i >= 0 && overlapLen < overlap; i--) {
        overlapWords.unshift(words[i])
        overlapLen += words[i].length + 1
      }
      current = overlapWords.join(' ') + ' ' + para
    } else {
      current = current ? current + '\n\n' + para : para
    }
  }

  if (current.trim()) {
    chunks.push({
      content: current.trim(),
      chunkIndex: chunkIndex,
      sectionReference: extractSectionRef(current),
    })
  }

  return chunks
}

function extractSectionRef(text: string): string | undefined {
  const match = text.match(
    /\b(Section|Article|Clause|Rule|Regulation|Part)\s+[\d.]+/i
  )
  return match?.[0]
}

// ── Embeddings ──────────────────────────────────────────────────

async function embedBatch(texts: string[]): Promise<number[][]> {
  if (VOYAGE_KEY) {
    const res = await fetch('https://api.voyageai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${VOYAGE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'voyage-3', input: texts }),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Voyage API error: ${res.status} ${err}`)
    }
    const data = await res.json()
    return data.data.map((d: any) => d.embedding)
  }

  // Fallback: OpenAI
  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: texts,
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI API error: ${res.status} ${err}`)
  }
  const data = await res.json()
  return data.data.map((d: any) => d.embedding)
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  console.log('Cricket Canada Document Seeder')
  console.log('=' .repeat(50))

  // 1. Find or create Cricket Canada org
  console.log('\n1. Looking up Cricket Canada organization...')
  let { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', 'cricket-canada')
    .single()

  if (!org) {
    console.log('   Creating Cricket Canada org...')
    const { data: newOrg } = await supabase
      .from('organizations')
      .insert({
        name: 'Cricket Canada',
        slug: 'cricket-canada',
        level: 'national',
        is_active: true,
      })
      .select()
      .single()
    org = newOrg
  }

  if (!org) {
    console.error('Failed to find/create Cricket Canada org')
    process.exit(1)
  }

  console.log(`   Org ID: ${org.id}`)

  // 2. Check which documents already exist
  const { data: existingDocs } = await supabase
    .from('documents')
    .select('name')
    .eq('org_id', org.id)

  const existingNames = new Set(existingDocs?.map((d) => d.name) || [])

  // 3. Process each document
  const files = fs.readdirSync(SOURCE_DIR).filter((f) => f.endsWith('.pdf'))
  console.log(`\n2. Found ${files.length} PDF files in source directory`)

  let processed = 0
  let skipped = 0
  let totalChunks = 0

  for (const filename of files) {
    // Skip duplicates
    if (SKIP_FILES.includes(filename)) {
      console.log(`   SKIP (duplicate): ${filename}`)
      skipped++
      continue
    }

    const meta = DOCUMENT_CATALOG[filename]
    if (!meta) {
      console.log(`   SKIP (not in catalog): ${filename}`)
      skipped++
      continue
    }

    // Skip if already processed
    if (existingNames.has(meta.name)) {
      console.log(`   SKIP (already exists): ${meta.name}`)
      skipped++
      continue
    }

    const filePath = path.join(SOURCE_DIR, filename)
    console.log(`\n   Processing: ${meta.name}`)
    console.log(`   File: ${filename}`)

    try {
      // Read and parse PDF
      const buffer = fs.readFileSync(filePath)
      const parsed = await pdf(buffer)
      let text = parsed.text.trim()
      console.log(`   Pages: ${parsed.numpages}, Text: ${text.length} chars`)

      // If very little text, try OCR (likely scanned/image PDF)
      if (text.length < 100) {
        console.log(`   Low text — attempting OCR...`)
        try {
          text = ocrPdf(filePath)
          console.log(`   OCR extracted: ${text.length} chars`)
        } catch (ocrErr: any) {
          console.log(`   OCR failed: ${ocrErr.message}`)
        }
      }

      if (text.length < 50) {
        console.log(`   WARNING: Very little text extracted, skipping`)
        skipped++
        continue
      }

      // Upload to Supabase Storage
      const storagePath = `cricket-canada/${Date.now()}-${filename}`
      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, buffer, { contentType: 'application/pdf' })

      if (uploadErr) {
        console.log(`   Storage upload failed: ${uploadErr.message}`)
        // Continue anyway — document can still be chunked
      }

      // Create document record
      const { data: doc, error: docErr } = await supabase
        .from('documents')
        .insert({
          org_id: org.id,
          name: meta.name,
          type: meta.type,
          version: meta.version,
          file_path: storagePath,
          file_size: buffer.length,
          is_active: true,
          processed: false,
        })
        .select()
        .single()

      if (docErr || !doc) {
        console.log(`   Failed to create document record: ${docErr?.message}`)
        continue
      }

      // Chunk the document
      const chunks = chunkText(text)
      console.log(`   Chunks: ${chunks.length}`)

      // Generate embeddings in batches of 20
      const batchSize = 20
      let chunkRecords: any[] = []

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize)
        console.log(
          `   Embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`
        )

        const embeddings = await embedBatch(batch.map((c) => c.content))

        chunkRecords.push(
          ...batch.map((chunk, j) => ({
            document_id: doc.id,
            org_id: org.id,
            content: chunk.content,
            chunk_index: chunk.chunkIndex,
            section_reference: chunk.sectionReference || null,
            page_number: chunk.pageNumber || null,
            embedding: embeddings[j],
          }))
        )

        // Small delay to respect API rate limits
        if (i + batchSize < chunks.length) {
          await new Promise((r) => setTimeout(r, 500))
        }
      }

      // Insert all chunks
      const { error: chunkErr } = await supabase
        .from('document_chunks')
        .insert(chunkRecords)

      if (chunkErr) {
        console.log(`   Failed to insert chunks: ${chunkErr.message}`)
        continue
      }

      // Mark document as processed
      await supabase
        .from('documents')
        .update({ processed: true })
        .eq('id', doc.id)

      processed++
      totalChunks += chunks.length
      console.log(`   Done! ${chunks.length} chunks created`)
    } catch (err: any) {
      console.error(`   ERROR: ${err.message}`)
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('SEED COMPLETE')
  console.log(`  Processed: ${processed} documents`)
  console.log(`  Skipped:   ${skipped} documents`)
  console.log(`  Chunks:    ${totalChunks} total`)
  console.log('='.repeat(50))
}

main().catch(console.error)
