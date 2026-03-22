'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { Document, Organization } from '@/lib/types'

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<(Document & { organizations: { name: string } })[]>([])
  const [orgs, setOrgs] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)

  // Upload form state
  const [showUpload, setShowUpload] = useState(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadOrgId, setUploadOrgId] = useState('')
  const [uploadName, setUploadName] = useState('')
  const [uploadType, setUploadType] = useState('other')
  const [uploadVersion, setUploadVersion] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/documents').then((r) => r.json()),
      fetch('/api/admin/orgs').then((r) => r.json()),
    ]).then(([docs, organizations]) => {
      setDocuments(docs)
      setOrgs(organizations)
      setLoading(false)
    })
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadFile || !uploadOrgId || !uploadName) return

    setUploading(true)
    setUploadStatus('Uploading and processing...')

    const formData = new FormData()
    formData.append('file', uploadFile)
    formData.append('orgId', uploadOrgId)
    formData.append('name', uploadName)
    formData.append('type', uploadType)
    formData.append('version', uploadVersion)

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()

      if (data.success) {
        toast.success(`Document processed — ${data.chunksCreated} chunks created`)
        setUploadStatus('')
        setShowUpload(false)
        const docs = await fetch('/api/admin/documents').then((r) => r.json())
        setDocuments(docs)
        setUploadFile(null)
        setUploadName('')
        setUploadVersion('')
      } else {
        toast.error(data.error || 'Processing failed')
        setUploadStatus(`Error: ${data.error}`)
      }
    } catch {
      toast.error('Upload failed. Please try again.')
      setUploadStatus('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (docId: string) => {
    if (!confirm('Delete this document and all its chunks? This cannot be undone.')) return
    setDeletingId(docId)
    try {
      await fetch(`/api/admin/documents/${docId}`, { method: 'DELETE' })
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      toast.success('Document deleted')
    } catch {
      toast.error('Failed to delete document')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Documents</h1>
          <p className="text-sm text-gray-500 mt-1">
            Upload and manage policy documents
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showUpload ? 'Cancel' : 'Upload document'}
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <form
          onSubmit={handleUpload}
          className="bg-white rounded-xl border border-gray-200 p-6 mb-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization
              </label>
              <select
                value={uploadOrgId}
                onChange={(e) => setUploadOrgId(e.target.value)}
                required
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
              >
                <option value="">Select organization</option>
                {orgs.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Document type
              </label>
              <select
                value={uploadType}
                onChange={(e) => setUploadType(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
              >
                <option value="bylaws">Bylaws</option>
                <option value="playing_rules">Playing Rules</option>
                <option value="registration">Registration</option>
                <option value="disciplinary">Disciplinary</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Document name
            </label>
            <input
              type="text"
              value={uploadName}
              onChange={(e) => setUploadName(e.target.value)}
              required
              placeholder="e.g. Registration & Eligibility Policy 2024"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Version (optional)
            </label>
            <input
              type="text"
              value={uploadVersion}
              onChange={(e) => setUploadVersion(e.target.value)}
              placeholder="e.g. 2024-v2"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PDF file
            </label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              required
              className="w-full text-sm"
            />
          </div>

          {uploadStatus && (
            <p className="text-sm text-gray-600">{uploadStatus}</p>
          )}

          <button
            type="submit"
            disabled={uploading || !uploadFile || !uploadOrgId || !uploadName}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {uploading ? 'Processing...' : 'Upload & process'}
          </button>
        </form>
      )}

      {/* Documents table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">
            Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-400">
            No documents yet. Upload your first policy document above.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                  Document
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                  Organization
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                  Type
                </th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                  Status
                </th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase tracking-wide px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800">
                      {doc.name}
                    </p>
                    {doc.version && (
                      <p className="text-xs text-gray-400">{doc.version}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {doc.organizations?.name || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                      {doc.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        doc.processed
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {doc.processed ? 'Ready' : 'Processing'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-xs text-red-500 hover:text-red-700 transition-colors"
                    >
                      Delete
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
