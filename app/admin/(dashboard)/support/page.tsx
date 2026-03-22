'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import type { SupportRequest } from '@/lib/types'

export default function AdminSupportPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    const supabase = createClientSupabaseClient()
    supabase
      .from('support_requests')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setRequests((data as SupportRequest[]) || [])
        setLoading(false)
      })
  }, [])

  const updateStatus = async (id: string, status: string) => {
    const supabase = createClientSupabaseClient()
    await supabase
      .from('support_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: status as SupportRequest['status'] } : r))
    )
    toast.success(`Status updated to ${status.replace('_', ' ')}`)
  }

  const saveNotes = async (id: string, notes: string) => {
    const supabase = createClientSupabaseClient()
    await supabase
      .from('support_requests')
      .update({ volunteer_notes: notes, updated_at: new Date().toISOString() })
      .eq('id', id)

    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...r, volunteer_notes: notes } : r))
    )
    toast.success('Notes saved')
  }

  const filtered =
    filter === 'all' ? requests : requests.filter((r) => r.status === filter)

  const statusColors: Record<string, string> = {
    open: 'bg-red-50 text-red-700',
    in_progress: 'bg-amber-50 text-amber-700',
    resolved: 'bg-emerald-50 text-emerald-700',
    closed: 'bg-gray-100 text-gray-500',
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            Support Inbox
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {requests.filter((r) => r.status === 'open').length} open requests
          </p>
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none"
        >
          <option value="all">All</option>
          <option value="open">Open</option>
          <option value="in_progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center text-sm text-gray-400 py-12">
          Loading...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center text-sm text-gray-400 py-12">
          No support requests found.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-gray-200 p-5"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${statusColors[req.status]}`}
                  >
                    {req.status.replace('_', ' ')}
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {req.issue_type}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(req.created_at).toLocaleDateString()}
                </span>
              </div>

              <p className="text-sm text-gray-800 mb-2">{req.description}</p>

              {req.original_question && (
                <p className="text-xs text-gray-500 mb-3">
                  Original question: &quot;{req.original_question}&quot;
                </p>
              )}

              {/* Volunteer notes */}
              <div className="mb-3">
                <textarea
                  defaultValue={req.volunteer_notes || ''}
                  onBlur={(e) => {
                    if (e.target.value !== (req.volunteer_notes || '')) {
                      saveNotes(req.id, e.target.value)
                    }
                  }}
                  placeholder="Add volunteer notes..."
                  rows={2}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400 resize-none bg-gray-50"
                />
              </div>

              <div className="flex items-center justify-between">
                <a
                  href={`mailto:${req.user_email}`}
                  className="text-xs text-emerald-600 hover:text-emerald-700"
                >
                  {req.user_email}
                </a>

                <div className="flex gap-2">
                  {req.status === 'open' && (
                    <button
                      onClick={() => updateStatus(req.id, 'in_progress')}
                      className="text-xs bg-amber-50 text-amber-700 px-3 py-1 rounded-lg hover:bg-amber-100 transition-colors"
                    >
                      Mark in progress
                    </button>
                  )}
                  {(req.status === 'open' || req.status === 'in_progress') && (
                    <button
                      onClick={() => updateStatus(req.id, 'resolved')}
                      className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1 rounded-lg hover:bg-emerald-100 transition-colors"
                    >
                      Mark resolved
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
