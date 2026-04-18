import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Dashboard() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    api.get('/events')
      .then((res) => setEvents(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [user, navigate])

  if (loading) {
    return <p className="text-center text-slate-500">Loading...</p>
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">My Events</h1>
        <Link
          to="/create"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
        >
          New Event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <p className="text-slate-500 mb-4">You haven't created any events yet.</p>
          <Link
            to="/create"
            className="text-blue-600 font-medium hover:text-blue-700"
          >
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-sm transition"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-slate-900">{event.name}</h2>
                  {event.description && (
                    <p className="text-sm text-slate-500 mt-1">{event.description}</p>
                  )}
                  <p className="text-xs text-slate-400 mt-1">
                    Created {new Date(event.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/e/${event.access_code}`}
                    className="text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition"
                  >
                    View
                  </Link>
                  {event.primary_contact_id === user?.id && (
                    <Link
                      to={`/e/${event.access_code}/admin`}
                      className="text-sm text-white bg-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-700 transition"
                    >
                      Manage
                    </Link>
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
