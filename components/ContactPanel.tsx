'use client'

import { useState } from 'react'
import { toast } from 'sonner'

const ISSUE_TYPES = [
  { value: 'registration', label: 'Registration' },
  { value: 'eligibility', label: 'Eligibility' },
  { value: 'suspension', label: 'Suspension / Disciplinary' },
  { value: 'policy_gap', label: 'Policy not covered' },
  { value: 'other', label: 'Other' },
]

export function ContactPanel({
  orgId,
  sessionId,
  originalQuestion,
}: {
  orgId?: string
  sessionId?: string
  originalQuestion?: string
}) {
  const [issueType, setIssueType] = useState('')
  const [description, setDescription] = useState(originalQuestion || '')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!issueType || !description || !email) return

    setSubmitting(true)
    try {
      await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          sessionId,
          issueType,
          originalQuestion,
          description,
          userEmail: email,
        }),
      })
      setSubmitted(true)
      toast.success('Request submitted! Check your email for confirmation.')
    } catch {
      toast.error('Failed to submit. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-6 py-8 text-center">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-emerald-800 mb-1">Request submitted</p>
        <p className="text-xs text-emerald-600">
          Our volunteer team will get back to you within 48–72 hours. Check your email for a confirmation.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Issue type
        </label>
        <select
          value={issueType}
          onChange={(e) => setIssueType(e.target.value)}
          required
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
        >
          <option value="">Select an issue type</option>
          {ISSUE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Describe your question or issue
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={4}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400 resize-none"
          placeholder="Tell us what you need help with..."
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Your email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
          placeholder="you@example.com"
        />
      </div>

      <button
        type="submit"
        disabled={submitting || !issueType || !description || !email}
        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
      >
        {submitting ? 'Submitting...' : 'Submit request'}
      </button>

      <p className="text-xs text-gray-400 text-center">
        This is a volunteer-run service. We typically respond within 48–72 hours.
      </p>
    </form>
  )
}
