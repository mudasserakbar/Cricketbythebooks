'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { MessageBubble } from './MessageBubble'
import { SoftProfileBanner } from './SoftProfileBanner'
import { DocumentCoverage } from './DocumentCoverage'
import { track } from '@/lib/track'
import { SCENARIOS } from '@/lib/scenarios'
import type { Organization, ChatMessage, Citation } from '@/lib/types'

const NOT_FOUND_MARKER = "This topic doesn't appear to be covered"

function extractCitations(text: string): Citation[] {
  const citations: Citation[] = []
  const seen = new Set<string>()
  const matches = Array.from(text.matchAll(/📄 Source: ([^,\n]+?)(?:,\s*([^\n📄]+))?(?:\n|$)/g))
  for (const match of matches) {
    const documentName = match[1]?.trim()
    const sectionReference = match[2]?.trim() || undefined
    if (!documentName) continue
    const key = documentName + (sectionReference || '')
    if (!seen.has(key)) {
      seen.add(key)
      citations.push({
        documentName,
        documentType: 'other',
        sectionReference,
        chunkContent: '',
        chunkId: crypto.randomUUID(),
      })
    }
  }
  return citations
}

export function ChatInterface({
  org,
  sessionId,
  scenarioId,
}: {
  org: Organization
  sessionId: string
  scenarioId?: string | null
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showProfileBanner, setShowProfileBanner] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const questionCount = useRef(0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Pre-populate input from scenario
  useEffect(() => {
    if (scenarioId) {
      const scenario = SCENARIOS.find((s) => s.id === scenarioId)
      if (scenario) setInput(scenario.starterQuestion)
    }
  }, [scenarioId])

  const clearChat = () => {
    setMessages([])
    questionCount.current = 0
    toast.success('Conversation cleared')
    track('chat_cleared', org.id, sessionId)
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const question = input.trim()
    setInput('')
    setLoading(true)

    track('question_asked', org.id, sessionId, { question_length: question.length })

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: question,
    }
    setMessages((prev) => [...prev, userMsg])

    const streamingId = crypto.randomUUID()

    try {
      const verificationToken = localStorage.getItem('cricket_verified') || ''
      const res = await fetch('/api/ask-stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-cricket-verified': verificationToken,
        },
        body: JSON.stringify({
          question,
          orgId: org.id,
          orgName: org.name,
          sessionId,
          conversationHistory: messages.slice(-6).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (res.status === 429) {
        toast.error('Too many questions. Please wait a moment.')
        setLoading(false)
        return
      }

      if (!res.ok || !res.body) {
        setMessages((prev) => [
          ...prev,
          { id: streamingId, role: 'assistant', content: '', found: false },
        ])
        setLoading(false)
        return
      }

      // Start streaming — hide typing indicator, show streaming bubble
      setLoading(false)
      setMessages((prev) => [...prev, { id: streamingId, role: 'assistant', content: '', isStreaming: true }])

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        setMessages((prev) =>
          prev.map((m) => (m.id === streamingId ? { ...m, content: accumulated } : m))
        )
      }

      const found = !accumulated.startsWith(NOT_FOUND_MARKER)
      const citations = found ? extractCitations(accumulated) : []

      setMessages((prev) =>
        prev.map((m) =>
          m.id === streamingId ? { ...m, isStreaming: false, found, citations } : m
        )
      )

      questionCount.current += 1
      if (questionCount.current === 1) {
        setTimeout(() => setShowProfileBanner(true), 1500)
      }
    } catch {
      setMessages((prev) => {
        const hasPlaceholder = prev.some((m) => m.id === streamingId)
        if (hasPlaceholder) {
          return prev.map((m) =>
            m.id === streamingId
              ? { ...m, isStreaming: false, found: false, content: '' }
              : m
          )
        }
        return [...prev, { id: streamingId, role: 'assistant', content: '', found: false }]
      })
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50/50 to-white">
      {/* Header */}
      <div className="glass sticky top-0 z-10 flex items-center justify-between px-5 py-3.5 border-b border-gray-100/50">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3.5 py-1.5 rounded-full shadow-sm">
            {org.name}
          </span>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-md hover:bg-gray-100 transition-all"
          >
            Clear
          </button>
        )}
      </div>

      {/* Document coverage */}
      <DocumentCoverage orgId={org.id} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {messages.length === 0 && (
          <WelcomeState orgName={org.name} scenarioId={scenarioId} onSuggest={setInput} />
        )}
        {messages.map((msg, i) => (
          <div key={msg.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
            <MessageBubble message={msg} orgName={org.name} sessionId={sessionId} />
          </div>
        ))}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Soft profile banner */}
      {showProfileBanner && (
        <div className="animate-slide-up">
          <SoftProfileBanner
            sessionId={sessionId}
            onDismiss={() => {
              setShowProfileBanner(false)
              track('soft_profile_dismissed', org.id, sessionId)
            }}
          />
        </div>
      )}

      {/* Input */}
      <div className="glass border-t border-gray-100/50 px-5 py-4">
        <div className="flex gap-3 items-center">
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              className="w-full text-sm bg-white border border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-all placeholder:text-gray-400"
              placeholder={`Ask about ${org.name} policy...`}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="w-11 h-11 gradient-emerald hover:opacity-90 disabled:opacity-30 rounded-xl flex items-center justify-center transition-all shadow-sm hover:shadow-md flex-shrink-0 active:scale-95"
          >
            <svg className="w-4.5 h-4.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="text-[11px] text-gray-400 mt-2.5 text-center">
          Answers cite official documents only &middot; Not legal advice
        </p>
      </div>
    </div>
  )
}

const SCENARIO_SUGGESTIONS: Record<string, { icon: string; text: string }[]> = {
  suspension: [
    { icon: '📋', text: 'What are the steps in the disciplinary process?' },
    { icon: '⏱️', text: 'How long can a suspension last?' },
    { icon: '🔄', text: 'Can I appeal a suspension and how?' },
    { icon: '📞', text: 'Who do I contact if I believe a suspension is unfair?' },
  ],
  registration: [
    { icon: '📝', text: 'What documents are required for player registration?' },
    { icon: '🔁', text: 'How do I transfer registration between clubs?' },
    { icon: '👶', text: 'What are the registration rules for youth players?' },
    { icon: '⏳', text: 'What is the deadline to register each season?' },
  ],
  eligibility: [
    { icon: '🏏', text: 'Can I play for two clubs in the same season?' },
    { icon: '🌍', text: 'What are the residency requirements for provincial teams?' },
    { icon: '🔄', text: 'How do I change my eligible organization?' },
    { icon: '⚖️', text: 'What makes a player ineligible for selection?' },
  ],
  conduct: [
    { icon: '📜', text: 'What behaviour counts as a code of conduct violation?' },
    { icon: '🚫', text: 'What are the consequences for a conduct breach?' },
    { icon: '👥', text: 'Does the code of conduct cover coaches and officials?' },
    { icon: '📝', text: 'How do I report a conduct incident?' },
  ],
  rules: [
    { icon: '🏏', text: 'What format rules apply to club matches?' },
    { icon: '🌧️', text: 'What happens if a match is rained out?' },
    { icon: '🧢', text: 'What are the equipment rules for players?' },
    { icon: '🏆', text: 'How is a competition winner determined if matches are tied?' },
  ],
  complaint: [
    { icon: '📝', text: 'How do I formally submit a complaint?' },
    { icon: '⏱️', text: 'What is the time limit for filing a complaint?' },
    { icon: '🔒', text: 'Is my complaint kept confidential?' },
    { icon: '📊', text: 'What happens after I submit a complaint?' },
  ],
}

const ORG_SUGGESTIONS: Record<string, { icon: string; text: string }[]> = {
  'Cricket Canada': [
    { icon: '📜', text: 'What is the Cricket Canada Code of Conduct?' },
    { icon: '⚖️', text: 'How do I file a discipline complaint?' },
    { icon: '🏏', text: 'What is the player selection policy for national teams?' },
    { icon: '🚫', text: 'What counts as disapproved cricket?' },
  ],
  'Cricket BC': [
    { icon: '📋', text: 'How are provincial teams selected?' },
    { icon: '⚖️', text: 'What is the discipline and complaints process?' },
    { icon: '🛡️', text: 'What does the child safeguarding policy cover?' },
    { icon: '🤝', text: 'What is the conflict of interest policy?' },
  ],
  'Cricket Quebec': [
    { icon: '📋', text: 'How do I register a player in Quebec?' },
    { icon: '🔄', text: 'How does a player transfer between clubs work?' },
    { icon: '🏏', text: 'What are the T20 playing conditions in Quebec?' },
    { icon: '👶', text: 'What forms are needed for junior player registration?' },
  ],
  default: [
    { icon: '📋', text: 'What are the registration requirements?' },
    { icon: '⚖️', text: 'How does the disciplinary process work?' },
    { icon: '📜', text: 'What is the code of conduct?' },
    { icon: '🏏', text: 'What are the eligibility rules?' },
  ],
}

function WelcomeState({
  orgName,
  scenarioId,
  onSuggest,
}: {
  orgName: string
  scenarioId?: string | null
  onSuggest: (q: string) => void
}) {
  const scenario = scenarioId ? SCENARIOS.find((s) => s.id === scenarioId) : null
  const suggestions =
    (scenarioId && SCENARIO_SUGGESTIONS[scenarioId]) ||
    ORG_SUGGESTIONS[orgName] ||
    ORG_SUGGESTIONS.default

  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12 gap-6 animate-fade-in">
      {/* Logo */}
      <div className="w-16 h-16 gradient-emerald rounded-2xl flex items-center justify-center shadow-glow">
        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 4.5c0 5 3 7.5 3 7.5s-3 2.5-3 7.5" strokeLinecap="round" />
          <path d="M16 4.5c0 5-3 7.5-3 7.5s3 2.5 3 7.5" strokeLinecap="round" />
        </svg>
      </div>

      <div>
        {scenario && (
          <div className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-full px-3 py-1 mb-3">
            <span>{scenario.emoji}</span>
            <span>{scenario.title}</span>
          </div>
        )}
        <p className="text-lg font-semibold text-gray-900 mb-2">
          {scenario ? `Let's find your answer` : `Ask anything about ${orgName}`}
        </p>
        <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
          {scenario
            ? `I'll search ${orgName}'s official documents and cite exactly where the answer comes from.`
            : `I'll find the answer in the official documents and cite exactly where it came from.`}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-2.5 w-full max-w-sm">
        {suggestions.map((s) => (
          <button
            key={s.text}
            onClick={() => onSuggest(s.text)}
            className="flex items-center gap-3 text-left text-sm text-gray-600 bg-white hover:bg-emerald-50 px-4 py-3 rounded-xl transition-all border border-gray-100 hover:border-emerald-200 shadow-soft hover:shadow-md group"
          >
            <span className="text-base">{s.icon}</span>
            <span className="group-hover:text-emerald-700 transition-colors">{s.text}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-1.5 px-4 py-3.5 bg-white/80 backdrop-blur-sm rounded-2xl rounded-tl-md w-fit shadow-soft border border-gray-100/50 animate-scale-in">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-emerald-400 rounded-full animate-typing-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  )
}
