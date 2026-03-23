/**
 * Seed Script: Process and upload policy documents for all organizations
 *
 * Usage:
 *   npx tsx scripts/seed-documents.ts              # Seed ALL orgs
 *   npx tsx scripts/seed-documents.ts cricket-canada  # Seed one org
 *   npx tsx scripts/seed-documents.ts cricket-bc      # Seed one org
 *
 * Requirements:
 *   - Supabase project configured with migration applied
 *   - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local
 *   - VOYAGE_API_KEY or OPENAI_API_KEY in .env.local
 *   - PDF files in the directories specified below
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
const HOME = process.env.HOME || '/Users/buraq'

// ── Types ───────────────────────────────────────────────────────

interface DocMeta {
  name: string
  type: 'bylaws' | 'playing_rules' | 'registration' | 'disciplinary' | 'other'
  version: string
}

interface OrgConfig {
  slug: string
  name: string
  level: 'national' | 'provincial'
  province?: string
  sourceDir: string
  skipFiles: string[]
  catalog: Record<string, DocMeta>
}

// ── Organization Configs ────────────────────────────────────────

const ORG_CONFIGS: OrgConfig[] = [
  // ── Cricket Canada ──────────────────────────────────────────
  {
    slug: 'cricket-canada',
    name: 'Cricket Canada',
    level: 'national',
    sourceDir: path.join(HOME, 'Desktop', 'cricket canada documents'),
    skipFiles: [
      '2_3.CC-POL-002-Discipline-Complaints-4 (1).pdf',
      '2_17.CC-POL-017-Travel-Policy-3 (1).pdf',
    ],
    catalog: {
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
    },
  },

  // ── Cricket BC ──────────────────────────────────────────────
  {
    slug: 'cricket-bc',
    name: 'Cricket BC',
    level: 'provincial',
    province: 'British Columbia',
    sourceDir: path.join(HOME, 'Desktop', 'cricket bc documents'),
    skipFiles: [],
    catalog: {
      'Cricket_BC_Bylaws.pdf': {
        name: 'Cricket BC Bylaws',
        type: 'bylaws',
        version: '2025',
      },
      'Cricket_BC_Constitution.pdf': {
        name: 'Cricket BC Constitution',
        type: 'bylaws',
        version: '2025',
      },
      'Cricket_BC_Code_of_Conduct.pdf': {
        name: 'Code of Conduct',
        type: 'disciplinary',
        version: '2025',
      },
      'BC_Universal_Code_of_Conduct.pdf': {
        name: 'BC Universal Code of Conduct',
        type: 'disciplinary',
        version: '2025',
      },
      'CCES_UCCMS_2025.pdf': {
        name: 'CCES Universal Code of Conduct (UCCMS 2025)',
        type: 'disciplinary',
        version: '2025',
      },
      'Cricket_BC_Child_Safeguarding.pdf': {
        name: 'Child Safeguarding Policy',
        type: 'other',
        version: '2025',
      },
      'Cricket_BC_Criminal_Record_Check.pdf': {
        name: 'Criminal Record Check Policy',
        type: 'other',
        version: '2025',
      },
      'Cricket_BC_Discipline_and_Complaints.pdf': {
        name: 'Discipline & Complaints Policy',
        type: 'disciplinary',
        version: '2025',
      },
      'Cricket_BC_Dispute_Resolution.pdf': {
        name: 'Dispute Resolution Policy',
        type: 'disciplinary',
        version: '2025',
      },
      'Cricket_BC_Conflict_of_Interest.pdf': {
        name: 'Conflict of Interest Policy',
        type: 'other',
        version: '2025',
      },
      'Cricket_BC_DEIA.pdf': {
        name: 'Diversity, Equity, Inclusion & Accessibility Policy',
        type: 'other',
        version: '2025',
      },
      'Cricket_BC_Privacy.pdf': {
        name: 'Privacy Policy',
        type: 'other',
        version: '2025',
      },
      'Cricket_BC_Fair_Play_Anti_Doping.pdf': {
        name: 'Fair Play & Anti-Doping Policy',
        type: 'playing_rules',
        version: '2025',
      },
      'Cricket_BC_Provincial_Team_Selection.pdf': {
        name: 'Provincial Team Selection Policy',
        type: 'registration',
        version: '2025',
      },
      'Cricket_BC_Strategic_Plan_2026-2030.pdf': {
        name: 'Strategic Plan 2026–2030',
        type: 'other',
        version: '2026-2030',
      },
      'Cricket_BC_Financial_Statements_Year_Ended_2025.pdf': {
        name: 'Financial Statements (Year Ended 2025)',
        type: 'other',
        version: '2025',
      },
      'Cricket_BC_AGM_Minutes_2025.pdf': {
        name: 'AGM Minutes 2025',
        type: 'other',
        version: '2025',
      },
    },
  },
]

// ── OCR fallback for scanned/image PDFs ─────────────────────────

function ocrPdf(filePath: string): string {
  const tmpDir = fs.mkdtempSync('/tmp/ocr-')
  try {
    execSync(`pdftoppm -png "${filePath}" "${tmpDir}/page"`, { timeout: 60000 })
    const pages = fs.readdirSync(tmpDir)
      .filter((f) => f.endsWith('.png'))
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

  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

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
      const words = current.split(' ')
      const overlapWords: string[] = []
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
    // Retry with backoff for rate limits (free tier: 3 RPM)
    for (let attempt = 0; attempt < 5; attempt++) {
      const res = await fetch('https://api.voyageai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VOYAGE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: 'voyage-3', input: texts }),
      })
      if (res.ok) {
        const data = await res.json()
        return data.data.map((d: any) => d.embedding)
      }
      if (res.status === 429) {
        const wait = 25 * (attempt + 1)
        console.log(`  Rate limited, waiting ${wait}s (attempt ${attempt + 1}/5)...`)
        await new Promise((r) => setTimeout(r, wait * 1000))
        continue
      }
      const err = await res.text()
      throw new Error(`Voyage API error: ${res.status} ${err}`)
    }
    throw new Error('Voyage API: exceeded retry attempts')
  }

  const res = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model: 'text-embedding-3-small', input: texts }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI API error: ${res.status} ${err}`)
  }
  const data = await res.json()
  return data.data.map((d: any) => d.embedding)
}

// ── Process one org ─────────────────────────────────────────────

async function seedOrg(config: OrgConfig) {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  ${config.name}`)
  console.log(`${'='.repeat(60)}`)

  // Check source directory exists
  if (!fs.existsSync(config.sourceDir)) {
    console.log(`  Source directory not found: ${config.sourceDir}`)
    console.log(`  Skipping ${config.name}`)
    return { processed: 0, skipped: 0, chunks: 0 }
  }

  // Find or create org
  let { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('slug', config.slug)
    .single()

  if (!org) {
    console.log(`  Creating ${config.name} organization...`)
    const { data: newOrg } = await supabase
      .from('organizations')
      .insert({
        name: config.name,
        slug: config.slug,
        level: config.level,
        province: config.province || null,
        is_active: true,
      })
      .select()
      .single()
    org = newOrg
  }

  if (!org) {
    console.error(`  Failed to find/create ${config.name}`)
    return { processed: 0, skipped: 0, chunks: 0 }
  }

  console.log(`  Org ID: ${org.id}`)

  // Check existing documents
  const { data: existingDocs } = await supabase
    .from('documents')
    .select('name')
    .eq('org_id', org.id)

  const existingNames = new Set(existingDocs?.map((d) => d.name) || [])

  // Process files
  const files = fs.readdirSync(config.sourceDir).filter((f) => f.endsWith('.pdf'))
  console.log(`  Found ${files.length} PDF files\n`)

  let processed = 0
  let skipped = 0
  let totalChunks = 0

  for (const filename of files) {
    if (config.skipFiles.includes(filename)) {
      console.log(`  SKIP (duplicate): ${filename}`)
      skipped++
      continue
    }

    const meta = config.catalog[filename]
    if (!meta) {
      console.log(`  SKIP (not in catalog): ${filename}`)
      skipped++
      continue
    }

    if (existingNames.has(meta.name)) {
      console.log(`  SKIP (already exists): ${meta.name}`)
      skipped++
      continue
    }

    const filePath = path.join(config.sourceDir, filename)
    console.log(`\n  Processing: ${meta.name}`)

    try {
      const buffer = fs.readFileSync(filePath)
      const parsed = await pdf(buffer)
      let text = parsed.text.trim()
      console.log(`  Pages: ${parsed.numpages}, Text: ${text.length} chars`)

      if (text.length < 100) {
        console.log(`  Low text — attempting OCR...`)
        try {
          text = ocrPdf(filePath)
          console.log(`  OCR extracted: ${text.length} chars`)
        } catch (ocrErr: any) {
          console.log(`  OCR failed: ${ocrErr.message}`)
        }
      }

      if (text.length < 50) {
        console.log(`  WARNING: Very little text extracted, skipping`)
        skipped++
        continue
      }

      // Upload to Storage
      const storagePath = `${config.slug}/${Date.now()}-${filename}`
      const { error: uploadErr } = await supabase.storage
        .from('documents')
        .upload(storagePath, buffer, { contentType: 'application/pdf' })

      if (uploadErr) {
        console.log(`  Storage upload failed: ${uploadErr.message}`)
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
        console.log(`  Failed to create document: ${docErr?.message}`)
        continue
      }

      // Chunk
      const chunks = chunkText(text)
      console.log(`  Chunks: ${chunks.length}`)

      // Embed in batches
      const batchSize = 20
      const chunkRecords: any[] = []

      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize)
        console.log(
          `  Embedding batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`
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

        if (i + batchSize < chunks.length) {
          await new Promise((r) => setTimeout(r, 500))
        }
      }

      // Insert chunks
      const { error: chunkErr } = await supabase
        .from('document_chunks')
        .insert(chunkRecords)

      if (chunkErr) {
        console.log(`  Failed to insert chunks: ${chunkErr.message}`)
        continue
      }

      // Mark processed
      await supabase.from('documents').update({ processed: true }).eq('id', doc.id)

      processed++
      totalChunks += chunks.length
      console.log(`  Done! ${chunks.length} chunks`)
    } catch (err: any) {
      console.error(`  ERROR: ${err.message}`)
    }
  }

  return { processed, skipped, chunks: totalChunks }
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  const targetSlug = process.argv[2] // Optional: seed specific org

  console.log('Cricket Policy Assistant — Document Seeder')
  console.log('='.repeat(60))

  const configs = targetSlug
    ? ORG_CONFIGS.filter((c) => c.slug === targetSlug)
    : ORG_CONFIGS

  if (configs.length === 0) {
    console.error(`Unknown org: ${targetSlug}`)
    console.log('Available orgs:', ORG_CONFIGS.map((c) => c.slug).join(', '))
    process.exit(1)
  }

  console.log(`Seeding: ${configs.map((c) => c.name).join(', ')}`)

  let grandTotal = { processed: 0, skipped: 0, chunks: 0 }

  for (const config of configs) {
    const result = await seedOrg(config)
    grandTotal.processed += result.processed
    grandTotal.skipped += result.skipped
    grandTotal.chunks += result.chunks
  }

  console.log('\n' + '='.repeat(60))
  console.log('SEED COMPLETE')
  console.log(`  Organizations: ${configs.length}`)
  console.log(`  Processed:     ${grandTotal.processed} documents`)
  console.log(`  Skipped:       ${grandTotal.skipped} documents`)
  console.log(`  Chunks:        ${grandTotal.chunks} total`)
  console.log('='.repeat(60))
}

main().catch(console.error)
