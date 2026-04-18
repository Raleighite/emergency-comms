import { useEffect, useState } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { eventApi, getEventPassword, setEventPassword } from '../api'
import PasswordGate from '../components/PasswordGate'
import Onboarding from '../components/Onboarding'

export default function EventView() {
  const { accessCode } = useParams()
  const [searchParams] = useSearchParams()
  const [event, setEvent] = useState(null)
  const [contributions, setContributions] = useState([])
  const [questions, setQuestions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [needsPassword, setNeedsPassword] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [visitorName, setVisitorName] = useState(() => localStorage.getItem('visitor_name') || '')
  const [contribMessage, setContribMessage] = useState('')
  const [questionText, setQuestionText] = useState('')
  const [submitStatus, setSubmitStatus] = useState('')
  const { user } = useAuth()
  const api = eventApi(accessCode)

  // Check for password in URL query param on mount
  useEffect(() => {
    const urlPassword = searchParams.get('p')
    if (urlPassword) {
      setEventPassword(accessCode, urlPassword)
    }
  }, [accessCode, searchParams])

  const fetchAll = () => {
    const password = getEventPassword(accessCode)
    if (!password) {
      setNeedsPassword(true)
      setLoading(false)
      return
    }

    Promise.all([
      api.get(`/events/${accessCode}`),
      api.get(`/events/${accessCode}/contributions`),
      api.get(`/events/${accessCode}/questions`),
    ])
      .then(([eventRes, contribRes, questionsRes]) => {
        setEvent(eventRes.data)
        setContributions(contribRes.data)
        setQuestions(questionsRes.data)
        setNeedsPassword(false)

        // Show onboarding on first visit
        if (!localStorage.getItem(`onboarding_${accessCode}`)) {
          setShowOnboarding(true)
        }
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          setNeedsPassword(true)
        } else {
          setError(err.response?.data?.error || 'Event not found')
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
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
      await api.post(`/events/${accessCode}/contributions`, {
        author_name: visitorName.trim(),
        message: contribMessage.trim(),
      })
      setContribMessage('')
      setSubmitStatus('Contribution posted!')
      setTimeout(() => setSubmitStatus(''), 3000)
      fetchAll()
    } catch (err) {
      setSubmitStatus(err.response?.data?.error || 'Failed to post')
    }
  }

  const handleQuestion = async (e) => {
    e.preventDefault()
    if (!visitorName.trim() || !questionText.trim()) return
    try {
      await api.post(`/events/${accessCode}/questions`, {
        author_name: visitorName.trim(),
        question: questionText.trim(),
      })
      setQuestionText('')
      setSubmitStatus('Question submitted!')
      setTimeout(() => setSubmitStatus(''), 3000)
      fetchAll()
    } catch (err) {
      setSubmitStatus(err.response?.data?.error || 'Failed to submit')
    }
  }

  if (loading) return <p className="text-center text-slate-500">Loading...</p>

  if (needsPassword) {
    return <PasswordGate accessCode={accessCode} onVerified={fetchAll} />
  }

  if (error) {
    return <div className="text-center py-12"><p className="text-red-600">{error}</p></div>
  }

  const isPrimary = user?.id === event?.primary_contact_id

  return (
    <div className="max-w-2xl mx-auto">
      {showOnboarding && (
        <Onboarding accessCode={accessCode} onDismiss={() => setShowOnboarding(false)} />
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{event.name}</h1>
            {event.description && <p className="text-slate-600 mt-1">{event.description}</p>}
            <p className="text-sm text-slate-400 mt-2">
              Primary contact: <span className="text-slate-600">{event.primary_contact_name}</span>
            </p>
          </div>
          {isPrimary && (
            <Link to={`/e/${accessCode}/admin`} className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition">
              Manage
            </Link>
          )}
        </div>
      </div>

      {submitStatus && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {submitStatus}
        </div>
      )}

      {/* Your Name (for contributions & questions) */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-1">Your name</label>
        <input
          type="text"
          value={visitorName}
          onChange={(e) => saveVisitorName(e.target.value)}
          placeholder="Enter your name"
          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        />
        <p className="text-xs text-slate-400 mt-1">Used when you post contributions or ask questions.</p>
      </div>

      {/* Official Updates */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Updates from {event.primary_contact_name}</h2>
        {(!event.updates || event.updates.length === 0) ? (
          <div className="bg-white rounded-xl border border-slate-200 p-6 text-center">
            <p className="text-slate-500">No updates yet. Check back soon.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {event.updates.map((update) => (
              <div key={update.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-slate-900 whitespace-pre-wrap">{update.message}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
                  <span className="font-medium text-slate-500">{update.author_name}</span>
                  <span>&middot;</span>
                  <span>{new Date(update.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Community Contributions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Community Updates</h2>
        <form onSubmit={handleContribution} className="bg-white rounded-xl border border-slate-200 p-4 mb-3">
          <textarea
            value={contribMessage}
            onChange={(e) => setContribMessage(e.target.value)}
            placeholder='Share helpful info (e.g., "I can bring dinner tonight")'
            required
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
          />
          <button
            type="submit"
            disabled={!visitorName.trim()}
            className="mt-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            Post
          </button>
        </form>
        {contributions.length > 0 && (
          <div className="space-y-2">
            {contributions.map((c) => (
              <div key={c.id} className="bg-slate-50 rounded-lg border border-slate-200 p-3">
                <p className="text-slate-800 text-sm whitespace-pre-wrap">{c.message}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <span className="font-medium text-slate-500">{c.author_name}</span>
                  <span>&middot;</span>
                  <span>{new Date(c.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Questions */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-800 mb-3">Questions</h2>

        {questions && (
          <div className="flex gap-3 mb-3">
            <div className="flex-1 bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-700">{questions.queue.total}</p>
              <p className="text-xs text-blue-600">Asked</p>
            </div>
            <div className="flex-1 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700">{questions.queue.answered}</p>
              <p className="text-xs text-green-600">Answered</p>
            </div>
            <div className="flex-1 bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-amber-700">{questions.queue.remaining}</p>
              <p className="text-xs text-amber-600">In Queue</p>
            </div>
          </div>
        )}

        <form onSubmit={handleQuestion} className="bg-white rounded-xl border border-slate-200 p-4 mb-3">
          <textarea
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            placeholder="Ask the primary contact a question..."
            required
            rows={2}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none text-sm"
          />
          <button
            type="submit"
            disabled={!visitorName.trim()}
            className="mt-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            Ask Question
          </button>
        </form>

        {questions && questions.questions.length > 0 && (
          <div className="space-y-2">
            {questions.questions.map((q) => (
              <div key={q.id} className={`rounded-lg border p-3 ${q.status === 'answered' ? 'bg-green-50 border-green-200' : 'bg-white border-slate-200'}`}>
                <div className="flex items-start justify-between">
                  <p className="text-slate-800 text-sm font-medium">Q: {q.question}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${q.status === 'answered' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    #{q.position} &middot; {q.status}
                  </span>
                </div>
                {q.answer && (
                  <p className="text-green-800 text-sm mt-2 pl-3 border-l-2 border-green-300">
                    A: {q.answer}
                  </p>
                )}
                <p className="text-xs text-slate-400 mt-2">{q.author_name} &middot; {new Date(q.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 text-center mt-8">
        This page refreshes automatically every 30 seconds.
      </p>
    </div>
  )
}
