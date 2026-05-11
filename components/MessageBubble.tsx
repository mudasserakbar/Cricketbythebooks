'use client'

import { useState, useCallback } from 'react'
import { CitationCard } from './CitationCard'
import { NotFoundCard } from './NotFoundCard'
import { FeedbackButtons } from './FeedbackButtons'
import { ShareButton } from './ShareButton'
import type { ChatMessage } from '@/lib/types'

function stripForSpeech(text: string): string {
  return text
    .replace(/📄 Source:[^\n]+/g, '')   // remove citations
    .replace(/[*_`#>]/g, '')             // remove markdown symbols
    .replace(/\n{2,}/g, '. ')            // paragraph breaks → pauses
    .replace(/\n/g, ' ')
    .trim()
}

function ListenButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false)

  const toggle = useCallback(() => {
    if (!('speechSynthesis' in window)) return

    if (speaking) {
      window.speechSynthesis.cancel()
      setSpeaking(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(stripForSpeech(text))
    utterance.rate = 0.92
    utterance.onend = () => setSpeaking(false)
    utterance.onerror = () => setSpeaking(false)
    window.speechSynthesis.speak(utterance)
    setSpeaking(true)
  }, [speaking, text])

  if (typeof window !== 'undefined' && !('speechSynthesis' in window)) return null

  return (
    <button
      onClick={toggle}
      aria-label={speaking ? 'Stop reading' : 'Listen to answer'}
      className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-all border ${
        speaking
          ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
          : 'text-gray-400 hover:text-emerald-600 bg-white border-gray-100 hover:border-emerald-200 hover:bg-emerald-50'
      }`}
    >
      {speaking ? (
        <>
          <span className="flex gap-0.5 items-end h-3">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-0.5 bg-emerald-500 rounded-full animate-typing-dot"
                style={{ height: `${8 + i * 3}px`, animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </span>
          Stop
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0l-3-3m3 3l3-3M9.172 9.172a4 4 0 000 5.656" />
          </svg>
          Listen
        </>
      )}
    </button>
  )
}

export function MessageBubble({
  message,
  orgName,
  orgSlug,
  sessionId,
}: {
  message: ChatMessage
  orgName: string
  orgSlug?: string
  sessionId?: string
}) {
  if (message.role === 'user') {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] gradient-emerald text-white text-sm px-4 py-3 rounded-2xl rounded-tr-md leading-relaxed shadow-sm">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2.5 max-w-[90%]">
      <div className="bg-white text-gray-800 text-sm px-4 py-3.5 rounded-2xl rounded-tl-md leading-relaxed whitespace-pre-wrap shadow-soft border border-gray-100/80">
        {message.content}
        {message.isStreaming && (
          <span className="inline-block w-0.5 h-4 bg-gray-400 ml-0.5 animate-pulse align-middle" />
        )}
      </div>
      {message.found && message.citations && message.citations.length > 0 && (
        <CitationCard citations={message.citations} />
      )}
      {message.found === false && (
        <NotFoundCard orgName={orgName} orgSlug={orgSlug} />
      )}
      <div className="flex items-center gap-2">
        {sessionId && (
          <FeedbackButtons messageId={message.id} sessionId={sessionId} />
        )}
        <ShareButton question="" answer={message.content} />
        {!message.isStreaming && message.content && message.found !== false && (
          <ListenButton text={message.content} />
        )}
      </div>
    </div>
  )
}
