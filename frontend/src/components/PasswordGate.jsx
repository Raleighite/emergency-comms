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
    <div className="max-w-md mx-auto text-center py-12">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">This event is protected</h1>
      <p className="text-slate-600 text-sm mb-6">
        Enter the password shared with you to view updates.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl border border-slate-200">
        <input
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Event password"
          required
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center"
        />
        <button
          type="submit"
          disabled={checking}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50"
        >
          {checking ? 'Checking...' : 'Enter'}
        </button>
        {error && (
          <p className="text-red-600 text-sm">{error}</p>
        )}
      </form>
    </div>
  )
}
