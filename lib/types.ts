export interface Organization {
  id: string
  name: string
  slug: string
  level: 'national' | 'provincial'
  province: string | null
  contact_email: string | null
  is_active: boolean
  created_at: string
}

export interface Document {
  id: string
  org_id: string
  name: string
  type: 'bylaws' | 'playing_rules' | 'registration' | 'disciplinary' | 'other'
  file_path: string
  file_size: number | null
  version: string | null
  is_active: boolean
  processed: boolean
  created_at: string
  updated_at: string
}

export interface DocumentChunk {
  id: string
  document_id: string
  org_id: string
  content: string
  chunk_index: number
  section_reference: string | null
  page_number: number | null
  created_at: string
}

export interface Session {
  id: string
  org_id: string | null
  user_role: string | null
  user_province: string | null
  user_email: string | null
  created_at: string
}

export interface Message {
  id: string
  session_id: string
  org_id: string | null
  role: 'user' | 'assistant'
  content: string
  answer_found: boolean | null
  cited_chunks: string[] | null
  created_at: string
}

export interface AnalyticsEvent {
  id: string
  event_type: string
  org_id: string | null
  session_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface SupportRequest {
  id: string
  org_id: string | null
  session_id: string | null
  issue_type: 'suspension' | 'eligibility' | 'registration' | 'policy_gap' | 'other'
  original_question: string | null
  description: string
  user_email: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  volunteer_notes: string | null
  created_at: string
  updated_at: string
}

export interface Citation {
  documentName: string
  documentType: string
  sectionReference?: string
  chunkContent: string
  chunkId: string
}

export interface RAGResult {
  answer: string
  found: boolean
  citations: Citation[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  found?: boolean
  citations?: Citation[]
}
