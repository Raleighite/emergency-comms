import { useState } from 'react'
import api, { setEventPassword } from '../api'

export default function PasswordGate({ accessCode, onVerified }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setChecking(true)
    try {
      const res = await api.post(`/events/${accessCode}/verify-password`, { password })
      if (res.data.valid) {
        setEventPassword(accessCode, password)
        onVerified()
      }
    } catch {
      setError('Incorrect password')
    } finally {
      setChecking(false)
    }
  }

  return (
    <div className="max-w-md mx-auto text-center pt-12">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-8">
        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-slate-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-gray-100 mb-1">This event is protected</h1>
        <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">Enter the password to view updates.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Event password"
            required
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-center"
          />
          <button
            type="submit"
            disabled={checking}
            className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition disabled:opacity-50"
          >
            {checking ? 'Checking...' : 'Enter'}
          </button>
          {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
        </form>
      </div>
    </div>
  )
}
