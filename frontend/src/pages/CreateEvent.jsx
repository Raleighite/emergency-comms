import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api, { setEventPassword } from '../api'

const TEMPLATES = [
  {
    id: 'medical_emergency',
    name: 'Medical Emergency',
    description: 'Hospital visit, surgery, or medical situation. Includes fields for hospital info, patient status, and visitor restrictions.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
  },
  {
    id: 'general',
    name: 'General',
    description: 'Any other emergency or situation that needs centralized updates.',
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
    ),
  },
]

export default function CreateEvent() {
  const [template, setTemplate] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) navigate('/login')
  }, [user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const res = await api.post('/events', { name, description, password, template })
      setEventPassword(res.data.access_code, password)
      navigate(`/e/${res.data.access_code}/admin`)
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  if (!template) {
    return (
      <div className="max-w-lg mx-auto pt-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100 mb-1">Create Event</h1>
        <p className="text-slate-500 dark:text-gray-400 text-sm mb-6">What type of situation is this?</p>
        <div className="space-y-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className="w-full text-left bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-md dark:border dark:border-slate-800 hover:shadow-lg hover:border-amber-300 dark:hover:border-amber-600 transition flex gap-4 items-start"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                {t.icon}
              </div>
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-gray-100">{t.name}</h3>
                <p className="text-sm text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">{t.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto pt-4">
      <button
        onClick={() => setTemplate('')}
        className="text-sm text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 mb-4 flex items-center gap-1 transition"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
        Change type
      </button>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100 mb-6">
        {TEMPLATES.find(t => t.id === template)?.name}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md dark:border dark:border-slate-800">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Event name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={template === 'medical_emergency' ? "e.g., Dad's Surgery" : "e.g., Family Emergency"}
            required
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">
            Description <span className="text-slate-400 dark:text-gray-500">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief context about the situation..."
            rows={3}
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Event password</label>
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="e.g., familydog123"
            required
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
          <p className="text-xs text-slate-500 dark:text-gray-500 mt-1.5">
            Included in the share link. Anyone with the link can view the event.
          </p>
        </div>

        {template === 'medical_emergency' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3.5 text-xs text-blue-700 dark:text-blue-400">
            You can add hospital details, room number, patient status, and visitor restrictions after creating the event.
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition disabled:opacity-50"
        >
          {submitting ? 'Creating...' : 'Create Event'}
        </button>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}
      </form>
    </div>
  )
}
