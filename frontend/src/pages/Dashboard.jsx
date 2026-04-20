import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { SkeletonList } from '../components/SkeletonLoader'
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100">My Events</h1>
        <Link
          to="/create"
          className="bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition"
        >
          New Event
        </Link>
      </div>

      {loading ? (
        <SkeletonList count={3} />
      ) : events.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-slate-500 dark:text-gray-400 mb-3">No events yet.</p>
          <Link to="/create" className="text-amber-600 dark:text-amber-400 font-medium hover:underline">
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-5 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold text-slate-900 dark:text-gray-100 truncate">{event.name}</h2>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      event.template === 'medical_emergency'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-gray-400'
                    }`}>
                      {event.template === 'medical_emergency' ? 'Medical' : 'General'}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-slate-500 dark:text-gray-400 truncate">{event.description}</p>
                  )}
                  <p className="text-xs text-slate-400 dark:text-gray-500 mt-1.5">
                    Created {new Date(event.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    to={`/e/${event.access_code}`}
                    className="text-sm text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition font-medium"
                  >
                    View
                  </Link>
                  {event.primary_contact_id === user?.id && (
                    <Link
                      to={`/e/${event.access_code}/admin`}
                      className="text-sm text-white bg-amber-500 px-3 py-2 rounded-xl hover:bg-amber-600 transition font-medium"
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
