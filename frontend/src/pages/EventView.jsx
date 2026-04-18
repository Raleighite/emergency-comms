import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function EventView() {
  const { accessCode } = useParams()
  const [event, setEvent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const { user } = useAuth()

  const fetchEvent = () => {
    api.get(`/events/${accessCode}`)
      .then((res) => setEvent(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Event not found'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchEvent()
    const interval = setInterval(fetchEvent, 30000)
    return () => clearInterval(interval)
  }, [accessCode])

  if (loading) return <p className="text-center text-slate-500">Loading...</p>
  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  const isPrimary = user?.id === event?.primary_contact_id

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{event.name}</h1>
            {event.description && (
              <p className="text-slate-600 mt-1">{event.description}</p>
            )}
            <p className="text-sm text-slate-400 mt-2">
              Primary contact: <span className="text-slate-600">{event.primary_contact_name}</span>
            </p>
          </div>
          {isPrimary && (
            <Link
              to={`/e/${accessCode}/admin`}
              className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
            >
              Manage
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-slate-800">Updates</h2>
        {(!event.updates || event.updates.length === 0) ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
            <p className="text-slate-500">No updates yet. Check back soon.</p>
          </div>
        ) : (
          event.updates.map((update) => (
            <div key={update.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-slate-900 whitespace-pre-wrap">{update.message}</p>
              <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                <span className="font-medium text-slate-500">{update.author_name}</span>
                <span>&middot;</span>
                <span>{new Date(update.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <p className="text-xs text-slate-400 text-center mt-8">
        This page refreshes automatically every 30 seconds.
      </p>
    </div>
  )
}
