import pdf from 'pdf-parse'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const SOURCE_DIR = path.join(process.env.HOME || '/Users/buraq', 'Desktop', 'cricket bc documents')

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

function ocrPdf(filePath: string): string {
  const tmpDir = fs.mkdtempSync('/tmp/ocr-')
  try {
    execSync(`pdftoppm -png "${filePath}" "${tmpDir}/page"`, { timeout: 60000 })
    const pages = fs.readdirSync(tmpDir).filter(f => f.endsWith('.png')).sort()
    let fullText = ''
    for (const page of pages) {
      fullText += execSync(`tesseract "${tmpDir}/${page}" stdout 2>/dev/null`, { timeout: 30000 }).toString() + '\n\n'
    }
    return fullText.trim()
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
}

async function main() {
  const files = fs.readdirSync(SOURCE_DIR).filter(f => f.endsWith('.pdf')).sort()
  console.log(`Found ${files.length} unique Cricket BC PDFs\n`)
  console.log(`${'Document'.padEnd(55)} Pages  Chars  Chunks  Method`)
  console.log('-'.repeat(95))

  let totalChunks = 0
  let totalPages = 0

  for (const file of files) {
    const buf = fs.readFileSync(path.join(SOURCE_DIR, file))
    const parsed = await pdf(buf)
    let text = parsed.text.trim()
    let method = 'text'

    if (text.length < 100) {
      try {
        text = ocrPdf(path.join(SOURCE_DIR, file))
        method = 'OCR'
      } catch { method = 'FAIL' }
    }

    const chunks = chunkText(text)
    totalChunks += chunks
    totalPages += parsed.numpages
    const name = file.length > 53 ? file.slice(0, 50) + '...' : file
    console.log(`${name.padEnd(55)} ${String(parsed.numpages).padStart(3)}  ${String(text.length).padStart(6)}  ${String(chunks).padStart(4)}  ${method}`)
  }

  console.log('-'.repeat(95))
  console.log(`TOTAL: ${files.length} documents, ${totalPages} pages, ${totalChunks} chunks`)
}

main().catch(console.error)
