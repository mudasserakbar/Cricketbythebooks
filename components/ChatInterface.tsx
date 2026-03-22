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
  const questionCount = useRef(0)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: data.error,
            found: false,
          },
        ])
      } else {
        const assistantMsg: ChatMessage = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: data.answer,
          found: data.found,
          citations: data.citations,
        }
        setMessages((prev) => [...prev, assistantMsg])
      }

      // Show soft profile banner after 1st question
      questionCount.current += 1
      if (questionCount.current === 1) {
        setTimeout(() => setShowProfileBanner(true), 1500)
      }
    } catch {
      toast.error('Connection error. Please check your internet and try again.')
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          found: false,
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">
          {org.name}
        </span>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Clear chat
          </button>
        )}
      </div>

      {/* Document coverage */}
      <DocumentCoverage orgId={org.id} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && <WelcomeState orgName={org.name} onSuggest={setInput} />}
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} orgName={org.name} sessionId={sessionId} />
        ))}
        {loading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Soft profile banner */}
      {showProfileBanner && (
        <SoftProfileBanner
          sessionId={sessionId}
          onDismiss={() => {
            setShowProfileBanner(false)
            track('soft_profile_dismissed', org.id, sessionId)
          }}
        />
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400 transition-colors"
            placeholder={`Ask about ${org.name} policy...`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' && !e.shiftKey && sendMessage()
            }
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            aria-label="Send message"
            className="w-9 h-9 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Answers are based on official documents only · Not legal advice
        </p>
      </div>
    </div>
  )
}

function WelcomeState({
  orgName,
  onSuggest,
}: {
  orgName: string
  onSuggest: (q: string) => void
}) {
  const suggestions = [
    'How do I register as a player?',
    'What are the eligibility requirements?',
    'How does the disciplinary process work?',
    'Can I play for two teams in the same season?',
  ]
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-4 py-8 gap-6">
      <div>
        <p className="text-base font-medium text-gray-800 mb-1">
          Ask anything about {orgName} policy
        </p>
        <p className="text-sm text-gray-500">
          I&apos;ll find the answer in the official documents and show you
          exactly where it came from.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => onSuggest(s)}
            className="text-left text-sm text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-2 rounded-lg transition-colors border border-gray-100"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-1 px-3 py-3 bg-gray-50 rounded-2xl rounded-tl-sm w-fit">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  )
}
