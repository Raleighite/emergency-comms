import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { eventApi, getEventPassword, setEventPassword } from '../api'
import PasswordGate from '../components/PasswordGate'
import Onboarding from '../components/Onboarding'
import { SkeletonList } from '../components/SkeletonLoader'
import Toast from '../components/Toast'

export default function EventView() {
  const { accessCode } = useParams()
  const [searchParams] = useSearchParams()
  const [event, setEvent] = useState(null)
  const [contributions, setContributions] = useState([])
  const [questions, setQuestions] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [visitorName, setVisitorName] = useState(() => localStorage.getItem('visitor_name') || '')
  const [contribMessage, setContribMessage] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [toast, setToast] = useState('')
  const [lastRefresh, setLastRefresh] = useState(Date.now())
  const { user } = useAuth()
  const api = eventApi(accessCode)

  useEffect(() => {
    const urlPassword = searchParams.get('p')
    if (urlPassword) setEventPassword(accessCode, urlPassword)
  }, [accessCode, searchParams])

  const fetchAll = () => {
    const password = getEventPassword(accessCode)
    if (!password) { setNeedsPassword(true); setLoading(false); return }

    Promise.all([
      api.get(`/events/${accessCode}`),
      api.get(`/events/${accessCode}/contributions`),
      api.get(`/events/${accessCode}/questions`),
      api.get(`/events/${accessCode}/attachments`),
    ])
      .then(([eventRes, contribRes, questionsRes, attachRes]) => {
        setEvent(eventRes.data)
        setContributions(contribRes.data)
        setQuestions(questionsRes.data)
        setAttachments(attachRes.data)
        setNeedsPassword(false)
        setLastRefresh(Date.now())
        if (!localStorage.getItem(`onboarding_${accessCode}`)) setShowOnboarding(true)
      })
      .catch((err) => {
        if (err.response?.status === 403) setNeedsPassword(true)
        else setError(err.response?.data?.error || 'Event not found')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 60000)
    return () => clearInterval(interval)
  }, [accessCode])

  const saveVisitorName = (name) => {
    setVisitorName(name)
    localStorage.setItem('visitor_name', name)
  }

  const handleContribution = async (e) => {
    e.preventDefault()
    if (!visitorName.trim() || !contribMessage.trim()) return
    try {
      await api.post(`/events/${accessCode}/contributions`, { author_name: visitorName.trim(), message: contribMessage.trim() })
      setContribMessage('')
      setToast('Contribution posted')
      fetchAll()
    } catch (err) { setToast(err.response?.data?.error || 'Failed to post') }
  }

  const handleQuestion = async (e) => {
    e.preventDefault()
    if (!visitorName.trim() || !questionText.trim()) return
    try {
      await api.post(`/events/${accessCode}/questions`, { author_name: visitorName.trim(), question: questionText.trim() })
      setQuestionText('')
      setToast('Question submitted')
      fetchAll()
    } catch (err) { setToast(err.response?.data?.error || 'Failed to submit') }
  }

  if (loading) return <SkeletonList count={4} />
  if (needsPassword) return <PasswordGate accessCode={accessCode} onVerified={fetchAll} />
  if (error) return <div className="text-center py-12"><p className="text-red-600 dark:text-red-400">{error}</p></div>

  const isPrimary = user?.id === event?.primary_contact_id
  const timeSinceRefresh = Math.round((Date.now() - lastRefresh) / 1000)

  return (
    <div className="max-w-2xl mx-auto">
      {showOnboarding && <Onboarding accessCode={accessCode} onDismiss={() => setShowOnboarding(false)} />}
      {toast && <Toast message={toast} onDone={() => setToast('')} />}

      {/* Event Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-5 mb-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-900 dark:text-gray-100">{event.name}</h1>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">Active</span>
            </div>
            {event.description && <p className="text-slate-600 dark:text-gray-400 text-sm">{event.description}</p>}
            <p className="text-xs text-slate-400 dark:text-gray-500 mt-2">
              Primary contact: <span className="text-slate-600 dark:text-gray-300">{event.primary_contact_name}</span>
            </p>
          </div>
          {isPrimary && (
            <Link to={`/e/${accessCode}/admin`} className="text-sm font-medium bg-amber-500 text-white px-3 py-2 rounded-xl hover:bg-amber-600 transition shrink-0">
              Manage
            </Link>
          )}
        </div>
      </div>

      {/* Medical Details */}
      {event.template === 'medical_emergency' && (
        <div className="bg-blue-50 dark:bg-blue-900/15 rounded-2xl border border-blue-200 dark:border-blue-800 p-5 mb-5">
          <h2 className="font-semibold text-blue-900 dark:text-blue-300 text-sm uppercase tracking-wide mb-3">Medical Details</h2>
          {event.details?.patient_status && (
            <div className="mb-3 bg-white dark:bg-slate-900 rounded-xl p-3 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium uppercase">Patient Status</p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-200">{event.details.patient_status}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {event.details?.hospital_name && <Detail label="Hospital" value={event.details.hospital_name} />}
            {event.details?.hospital_address && <Detail label="Address" value={event.details.hospital_address} />}
            {event.details?.room_number && <Detail label="Room / Bed" value={event.details.room_number} />}
            {event.details?.visitor_limits && <Detail label="Visitor Restrictions" value={event.details.visitor_limits} />}
          </div>
          {event.details?.notes && (
            <div className="mt-3">
              <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Notes</p>
              <p className="text-slate-700 dark:text-gray-300 text-sm whitespace-pre-wrap mt-1">{event.details.notes}</p>
            </div>
          )}
          {!event.details?.patient_status && !event.details?.hospital_name && (
            <p className="text-blue-600 dark:text-blue-400 text-sm">No medical details added yet.</p>
          )}
        </div>
      )}

      {/* Attachments */}
      {attachments.length > 0 && (
        <div className="mb-5">
          <h2 className="text-sm font-semibold text-slate-800 dark:text-gray-200 uppercase tracking-wide mb-3">Attachments</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {attachments.map((a) => (
              <div key={a.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                {a.content_type?.startsWith('image/') ? (
                  <img src={`data:${a.content_type};base64,${a.data}`} alt={a.filename} className="w-full h-32 object-cover" />
                ) : (
                  <div className="h-32 flex items-center justify-center bg-slate-50 dark:bg-slate-800">
                    <p className="text-slate-400 text-xs">{a.filename}</p>
                  </div>
                )}
                <div className="p-2"><p className="text-xs text-slate-500 dark:text-gray-500 truncate">{a.filename}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Your Name */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-4 mb-5">
        <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Your name</label>
        <input
          type="text"
          value={visitorName}
          onChange={(e) => saveVisitorName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm"
        />
        <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Used when you post contributions or ask questions.</p>
      </div>

      {/* Updates */}
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-gray-200 uppercase tracking-wide mb-3">Updates</h2>
        {(!event.updates || event.updates.length === 0) ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-8 text-center">
            <p className="text-slate-500 dark:text-gray-400">No updates yet — check back soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {event.updates.map((update) => (
              <div key={update.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-4 border-l-4 border-l-blue-400 dark:border-l-blue-500">
                <p className="text-slate-900 dark:text-gray-100 whitespace-pre-wrap">{update.message}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-slate-400 dark:text-gray-500">
                  <span className="font-medium text-slate-500 dark:text-gray-400">{update.author_name}</span>
                  <span>&middot;</span>
                  <span>{new Date(update.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Community Contributions */}
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-gray-200 uppercase tracking-wide mb-3">Community Updates</h2>
        <form onSubmit={handleContribution} className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-4 mb-3">
          <textarea
            value={contribMessage}
            onChange={(e) => setContribMessage(e.target.value)}
            placeholder='Share helpful info (e.g., "I can bring dinner tonight")'
            required
            rows={2}
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none text-sm"
          />
          <button type="submit" disabled={!visitorName.trim()} className="mt-2 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-50">
            Post
          </button>
        </form>
        {contributions.length > 0 && (
          <div className="space-y-2">
            {contributions.map((c) => (
              <div key={c.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                <p className="text-slate-800 dark:text-gray-200 text-sm whitespace-pre-wrap">{c.message}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400 dark:text-gray-500">
                  <span className="font-medium text-slate-500 dark:text-gray-400">{c.author_name}</span>
                  <span>&middot;</span>
                  <span>{new Date(c.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-gray-200 uppercase tracking-wide mb-3">Questions</h2>
        {questions && (
          <div className="flex gap-3 mb-3">
            <QueueStat label="Asked" value={questions.queue.total} color="blue" />
            <QueueStat label="Answered" value={questions.queue.answered} color="green" />
            <QueueStat label="In Queue" value={questions.queue.remaining} color="amber" />
          </div>
        )}
        <form onSubmit={handleQuestion} className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-4 mb-3">
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Ask the primary contact a question..."
            required
            rows={2}
            className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none text-sm"
          />
          <button type="submit" disabled={!visitorName.trim()} className="mt-2 bg-amber-500 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-50">
            Ask Question
          </button>
        </form>
        {questions && questions.questions.length > 0 && (
          <div className="space-y-2">
            {questions.questions.map((q) => (
              <div key={q.id} className={`rounded-xl border p-3 ${q.status === 'answered' ? 'bg-green-50 dark:bg-green-900/15 border-green-200 dark:border-green-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-slate-800 dark:text-gray-200 text-sm font-medium">Q: {q.question}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${q.status === 'answered' ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400'}`}>
                    #{q.position}
                  </span>
                </div>
                {q.answer && (
                  <p className="text-green-800 dark:text-green-300 text-sm mt-2 pl-3 border-l-2 border-green-300 dark:border-green-700">A: {q.answer}</p>
                )}
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-2">{q.author_name} &middot; {new Date(q.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Auto-refresh indicator */}
      <p className="text-xs text-slate-400 dark:text-gray-600 text-center mt-8">
        Auto-refreshes every 60 seconds
      </p>
    </div>
  )
}

function Detail({ label, value }) {
  return (
    <div>
      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">{label}</p>
      <p className="text-slate-800 dark:text-gray-300">{value}</p>
    </div>
  )
}

function QueueStat({ label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
  }
  return (
    <div className={`flex-1 border rounded-xl p-3 text-center ${colors[color]}`}>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-xs font-medium">{label}</p>
    </div>
  )
}
