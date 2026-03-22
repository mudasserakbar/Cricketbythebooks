/**
 * Dry run: parse all PDFs and show chunk counts (no Supabase or embeddings needed)
 * Usage: npx tsx scripts/test-parse.ts
 */
import pdf from 'pdf-parse'
import fs from 'fs'
import path from 'path'

const SOURCE_DIR = path.join(
  process.env.HOME || '/Users/buraq',
  'Desktop',
  'cricket canada documents'
)

const SKIP = ['2_3.CC-POL-002-Discipline-Complaints-4 (1).pdf', '2_17.CC-POL-017-Travel-Policy-3 (1).pdf']

function chunkText(text: string): number {
  const chunkSize = 800
  const cleaned = text.replace(/\r\n/g, '\n').replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
  const paragraphs = cleaned.split(/\n\n+/)
  let current = ''
  let count = 0
  for (const para of paragraphs) {
    if (current.length + para.length > chunkSize && current.length > 0) {
      count++
      const words = current.split(' ')
      const overlapWords: string[] = []
      let overlapLen = 0
      for (let i = words.length - 1; i >= 0 && overlapLen < 150; i--) {
        overlapWords.unshift(words[i])
        overlapLen += words[i].length + 1
      }
      current = overlapWords.join(' ') + ' ' + para
    } else {
      current = current ? current + '\n\n' + para : para
    }
  }
  if (current.trim()) count++
  return count
}

async function main() {
  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.pdf') && !SKIP.includes(f))
  console.log(`Found ${files.length} unique PDFs\n`)
  console.log(`${'Document'.padEnd(60)} Pages  Chars  Chunks`)
  console.log('-'.repeat(90))

  let totalChunks = 0
  let totalPages = 0

  for (const file of files.sort()) {
    const buf = fs.readFileSync(path.join(SOURCE_DIR, file))
    const parsed = await pdf(buf)
    const chunks = chunkText(parsed.text)
    totalChunks += chunks
    totalPages += parsed.numpages
    const name = file.length > 58 ? file.slice(0, 55) + '...' : file
    console.log(`${name.padEnd(60)} ${String(parsed.numpages).padStart(3)}  ${String(parsed.text.length).padStart(6)}  ${String(chunks).padStart(4)}`)
  }

  console.log('-'.repeat(90))
  console.log(`TOTAL: ${files.length} documents, ${totalPages} pages, ${totalChunks} chunks`)
  console.log(`\nEstimated embedding cost (Voyage AI): ~$${(totalChunks * 0.0001).toFixed(2)}`)
  console.log(`Estimated embedding cost (OpenAI):    ~$${(totalChunks * 0.00002).toFixed(4)}`)
}

main().catch(console.error)
