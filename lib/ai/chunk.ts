import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

export interface Chunk {
  content: string
  chunkIndex: number
  sectionReference?: string
  pageNumber?: number
}

export async function chunkDocument(text: string): Promise<Chunk[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 800,
    chunkOverlap: 150,
    separators: ['\n\n', '\n', '. ', ' '],
  })

  const docs = await splitter.createDocuments([text])

  return docs.map((doc, i) => ({
    content: doc.pageContent,
    chunkIndex: i,
    sectionReference: extractSectionRef(doc.pageContent),
  }))
}

function extractSectionRef(text: string): string | undefined {
  const match = text.match(
    /\b(Section|Article|Clause|Rule|Regulation)\s+[\d.]+/i
  )
  return match?.[0]
}
