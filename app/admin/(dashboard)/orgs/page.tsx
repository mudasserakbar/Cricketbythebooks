'use client'

import { useEffect, useState } from 'react'
import type { Organization } from '@/lib/types'

export default function AdminOrgsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/orgs')
      .then((r) => r.json())
      .then((data) => {
        setOrgs(data)
        setLoading(false)
      })
  }, [])

  const toggleActive = async (org: Organization) => {
    await fetch(`/api/admin/orgs/${org.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !org.is_active }),
    })
    setOrgs((prev) =>
      prev.map((o) =>
        o.id === org.id ? { ...o, is_active: !o.is_active } : o
      )
    )
  }

  const updateEmail = async (orgId: string, email: string) => {
    await fetch(`/api/admin/orgs/${orgId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact_email: email }),
    })
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-gray-900">Organizations</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage cricket organizations
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">
            Loading...
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                  Organization
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                  Level
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                  Contact email
                </th>
                <th className="text-center text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                  Active
                </th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((org) => (
                <tr key={org.id} className="border-b border-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800">
                      {org.name}
                    </p>
                    <p className="text-xs text-gray-400">{org.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        org.level === 'national'
                          ? 'bg-blue-50 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {org.level}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="email"
                      defaultValue={org.contact_email || ''}
                      onBlur={(e) => updateEmail(org.id, e.target.value)}
                      placeholder="Set contact email"
                      className="text-sm border border-gray-200 rounded px-2 py-1 outline-none focus:border-emerald-400 w-full max-w-xs"
                    />
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(org)}
                      className={`w-8 h-5 rounded-full relative transition-colors ${
                        org.is_active ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          org.is_active ? 'left-3.5' : 'left-0.5'
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
