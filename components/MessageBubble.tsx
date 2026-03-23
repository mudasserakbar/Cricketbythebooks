'use client'

import { CitationCard } from './CitationCard'
import { NotFoundCard } from './NotFoundCard'
import { FeedbackButtons } from './FeedbackButtons'
import { ShareButton } from './ShareButton'
import type { ChatMessage } from '@/lib/types'

export function MessageBubble({
  message,
  orgName,
  sessionId,
}: {
  message: ChatMessage
  orgName: string
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
      </div>
      {message.found && message.citations && message.citations.length > 0 && (
        <CitationCard citations={message.citations} />
      )}
      {message.found === false && (
        <NotFoundCard orgName={orgName} />
      )}
      <div className="flex items-center gap-2">
        {sessionId && (
          <FeedbackButtons messageId={message.id} sessionId={sessionId} />
        )}
        <ShareButton question="" answer={message.content} />
      </div>
    </div>
  )
}
