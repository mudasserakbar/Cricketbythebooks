'use client'

import { useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'

const ROLES = ['Player / athlete', 'Coach', 'Team manager', 'Parent', 'Umpire']

export function SoftProfileBanner({
  sessionId,
  onDismiss,
}: {
  sessionId: string
  onDismiss: () => void
}) {
  const [step, setStep] = useState<'prompt' | 'form' | 'done'>('prompt')
  const [role, setRole] = useState('')
  const [email, setEmail] = useState('')

  const save = async () => {
    const supabase = createClientSupabaseClient()
    await supabase
      .from('sessions')
      .update({
        user_role: role
          .toLowerCase()
          .replace(' / ', '_')
          .replace(' ', '_'),
        user_email: email || null,
      })
      .eq('id', sessionId)
    setStep('done')
    setTimeout(onDismiss, 1500)
  }

  if (step === 'done') {
    return (
      <div className="mx-4 mb-3 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-xs text-emerald-700">
        Thanks! This helps us improve the tool for the community.
      </div>
    )
  }

  if (step === 'prompt') {
    return (
      <div className="mx-4 mb-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <p className="text-xs text-gray-600 flex-1">
          Help us improve — tell us a bit about yourself? (optional)
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => setStep('form')}
            className="text-xs bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Sure
          </button>
          <button
            onClick={onDismiss}
            className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-4 mb-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 space-y-3">
      <p className="text-xs font-medium text-gray-700">Your role</p>
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              role === r
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white border-gray-200 text-gray-600 hover:border-emerald-300'
            }`}
          >
            {r}
          </button>
        ))}
      </div>
      <input
        type="email"
        placeholder="Email for policy update alerts (optional)"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
      />
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={!role}
          className="text-xs bg-emerald-600 disabled:opacity-40 text-white px-4 py-1.5 rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Save
        </button>
        <button
          onClick={onDismiss}
          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1.5 transition-colors"
        >
          Skip
        </button>
      </div>
    </div>
  )
}
