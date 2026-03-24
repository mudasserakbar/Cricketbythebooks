'use client'

import { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { MessageBubble } from './MessageBubble'
import { SoftProfileBanner } from './SoftProfileBanner'
import { DocumentCoverage } from './DocumentCoverage'
import { track } from '@/lib/track'
import type { Organization, ChatMessage } from '@/lib/types'

export function ChatInterface({
  org,
  sessionId,
}: {
  org: Organization
  sessionId: string
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

    try {
      const verificationToken = localStorage.getItem('cricket_verified') || ''
      const res = await fetch('/api/ask', {
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

      const data = await res.json()

      if (data.error && !data.answer) {
        toast.error(data.error)
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: 'assistant', content: data.error, found: false },
        ])
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.answer,
            found: data.found,
            citations: data.citations,
          },
        ])
      }

      questionCount.current += 1
      if (questionCount.current === 1) {
        setTimeout(() => setShowProfileBanner(true), 1500)
      }
    } catch {
      toast.error('Connection error. Please try again.')
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: 'assistant', content: 'Sorry, something went wrong.', found: false },
      ])
    } finally {
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
        {messages.length === 0 && <WelcomeState orgName={org.name} onSuggest={setInput} />}
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
  default: [
    { icon: '📋', text: 'What are the registration requirements?' },
    { icon: '⚖️', text: 'How does the disciplinary process work?' },
    { icon: '📜', text: 'What is the code of conduct?' },
    { icon: '🏏', text: 'What are the eligibility rules?' },
  ],
}

function WelcomeState({
  orgName,
  onSuggest,
}: {
  orgName: string
  onSuggest: (q: string) => void
}) {
  const suggestions = ORG_SUGGESTIONS[orgName] || ORG_SUGGESTIONS.default
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12 gap-8 animate-fade-in">
      {/* Logo */}
      <div className="w-16 h-16 gradient-emerald rounded-2xl flex items-center justify-center shadow-glow">
        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M8 4.5c0 5 3 7.5 3 7.5s-3 2.5-3 7.5" strokeLinecap="round" />
          <path d="M16 4.5c0 5-3 7.5-3 7.5s3 2.5 3 7.5" strokeLinecap="round" />
        </svg>
      </div>
      <div>
        <p className="text-lg font-semibold text-gray-900 mb-2">
          Ask anything about {orgName}
        </p>
        <p className="text-sm text-gray-500 max-w-xs mx-auto leading-relaxed">
          I&apos;ll find the answer in the official documents and cite exactly where it came from.
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
          className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}
