'use client'

import { useState } from 'react'
import { createClientSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const supabase = createClientSupabaseClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        return
      }

      router.push('/admin')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-3">
            <span className="text-white text-sm font-bold">CP</span>
          </div>
          <h1 className="text-lg font-semibold text-gray-900">Admin Login</h1>
          <p className="text-sm text-gray-500 mt-1">
            Cricket by the Books
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="bg-white rounded-xl border border-gray-200 p-6 space-y-4"
        >
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-xs px-3 py-2 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-emerald-400"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
