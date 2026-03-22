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
        <div className="max-w-[85%] bg-emerald-600 text-white text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2 max-w-[90%]">
      <div className="bg-gray-50 text-gray-800 text-sm px-4 py-3 rounded-2xl rounded-tl-sm leading-relaxed whitespace-pre-wrap">
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
