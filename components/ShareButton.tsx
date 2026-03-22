'use client'

import { useState } from 'react'
import { toast } from 'sonner'

export function ShareButton({ question, answer }: { question: string; answer: string }) {
  const [copied, setCopied] = useState(false)

  const share = async () => {
    const text = `Q: ${question}\n\nA: ${answer}\n\n— Cricket Policy Assistant`

    if (navigator.share) {
      try {
        await navigator.share({ text })
        return
      } catch {
        // Fallback to clipboard
      }
    }

    await navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={share}
      className="text-gray-300 hover:text-gray-500 transition-colors p-0.5"
      title="Share this answer"
    >
      {copied ? (
        <svg className="w-3.5 h-3.5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      )}
    </button>
  )
}
