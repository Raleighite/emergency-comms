import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { eventApi, getEventPassword } from '../api'

export default function EventAdmin() {
  const { accessCode } = useParams()
  const [event, setEvent] = useState(null)
  const [questions, setQuestions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [transferEmail, setTransferEmail] = useState('')
  const [subscriberPhone, setSubscriberPhone] = useState('')
  const [subscriberName, setSubscriberName] = useState('')
  const [subscribers, setSubscribers] = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [posting, setPosting] = useState(false)
  const [showTransfer, setShowTransfer] = useState(false)
  const [showSubscribers, setShowSubscribers] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const api = eventApi(accessCode)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchEvent()
    fetchQuestions()
  }, [user, accessCode, navigate])

  const fetchEvent = () => {
    api.get(`/events/${accessCode}`)
      .then((res) => {
        setEvent(res.data)
        if (res.data.primary_contact_id !== user?.id) {
          navigate(`/e/${accessCode}`)
        }
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false))
  }

  const fetchQuestions = () => {
    api.get(`/events/${accessCode}/questions`)
      .then((res) => setQuestions(res.data))
      .catch(() => {})
  }

  const fetchSubscribers = () => {
    api.get(`/events/${accessCode}/subscribers`)
      .then((res) => setSubscribers(res.data))
      .catch(() => {})
  }

  const handlePostUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setPosting(true)
    try {
      await api.post(`/events/${accessCode}/updates`, { message })
      setMessage('')
      setSuccess('Update posted')
      fetchEvent()
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post update')
    } finally {
      setPosting(false)
    }
  }

  const handleTransfer = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post(`/events/${accessCode}/transfer`, { email: transferEmail })
      setSuccess('Primary contact transferred. Redirecting...')
      setTimeout(() => navigate(`/e/${accessCode}`), 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to transfer')
    }
  }

  const handleAddSubscriber = async (e) => {
    e.preventDefault()
    setError('')
    try {
      await api.post(`/events/${accessCode}/subscribers`, {
        phone: subscriberPhone,
        name: subscriberName,
      })
      setSubscriberPhone('')
      setSubscriberName('')
      fetchSubscribers()
      setSuccess('Subscriber added')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add subscriber')
    }
  }

  const handleInviteEmail = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post(`/events/${accessCode}/invite-email`, { email: inviteEmail })
      setInviteEmail('')
      setSuccess(res.data.message)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send invite')
    }
  }

  const handleAnswerQuestion = async (questionId, answer) => {
    try {
      await api.post(`/events/${accessCode}/questions/${questionId}/answer`, { answer })
      fetchQuestions()
      setSuccess('Question answered')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to answer')
    }
  }

  const copyShareLink = () => {
    const password = getEventPassword(accessCode)
    const link = `${window.location.origin}/e/${accessCode}?p=${encodeURIComponent(password)}`
    navigator.clipboard.writeText(link)
    setSuccess('Link copied! Password is included in the link.')
    setTimeout(() => setSuccess(''), 3000)
  }

  if (loading) return <p className="text-center text-slate-500">Loading...</p>

  const pendingQuestions = questions?.questions.filter(q => q.status === 'pending') || []

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{event?.name}</h1>
          <p className="text-sm text-slate-500">You are the primary contact</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={copyShareLink}
            className="text-sm bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            Copy Share Link
          </button>
          <Link
            to={`/e/${accessCode}`}
            className="text-sm bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition"
          >
            Public View
          </Link>
        </div>
      </div>

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Post Update */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <h2 className="font-semibold text-slate-800 mb-3">Post an Update</h2>
        <form onSubmit={handlePostUpdate} className="space-y-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's the latest?"
            required
            rows={3}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
          />
          <button
            type="submit"
            disabled={posting}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50"
          >
            {posting ? 'Posting...' : 'Post Update'}
          </button>
        </form>
      </div>

      {/* Questions to Answer */}
      {pendingQuestions.length > 0 && (
        <div className="bg-amber-50 rounded-xl border border-amber-200 p-4 mb-6">
          <h2 className="font-semibold text-amber-800 mb-3">
            Questions to Answer ({pendingQuestions.length})
          </h2>
          <div className="space-y-3">
            {pendingQuestions.map((q) => (
              <QuestionAnswer key={q.id} question={q} onAnswer={handleAnswerQuestion} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Updates */}
      <div className="mb-6">
        <h2 className="font-semibold text-slate-800 mb-3">Recent Updates</h2>
        {(!event?.updates || event.updates.length === 0) ? (
          <p className="text-slate-500 text-sm">No updates yet.</p>
        ) : (
          <div className="space-y-3">
            {event.updates.map((update) => (
              <div key={update.id} className="bg-white rounded-xl border border-slate-200 p-4">
                <p className="text-slate-900 whitespace-pre-wrap">{update.message}</p>
                <p className="text-xs text-slate-400 mt-2">
                  {new Date(update.created_at).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite by Email */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <h2 className="font-semibold text-slate-800 mb-3">Invite by Email</h2>
        <p className="text-sm text-slate-500 mb-3">
          Send an email with the event link so they can view updates.
        </p>
        <form onSubmit={handleInviteEmail} className="flex gap-2">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="friend@example.com"
            required
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            Send Invite
          </button>
        </form>
      </div>

      {/* SMS Subscribers */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <button
          onClick={() => { setShowSubscribers(!showSubscribers); if (!showSubscribers) fetchSubscribers() }}
          className="flex items-center justify-between w-full"
        >
          <h2 className="font-semibold text-slate-800">SMS Subscribers (Premium)</h2>
          <span className="text-slate-400 text-sm">{showSubscribers ? 'Hide' : 'Show'}</span>
        </button>
        {showSubscribers && (
          <div className="mt-4 space-y-4">
            <form onSubmit={handleAddSubscriber} className="flex gap-2">
              <input
                type="text"
                value={subscriberName}
                onChange={(e) => setSubscriberName(e.target.value)}
                placeholder="Name"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
              <input
                type="tel"
                value={subscriberPhone}
                onChange={(e) => setSubscriberPhone(e.target.value)}
                placeholder="Phone number"
                required
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 transition"
              >
                Add
              </button>
            </form>
            {subscribers.length > 0 && (
              <ul className="space-y-1">
                {subscribers.map((sub, i) => (
                  <li key={i} className="text-sm text-slate-600">
                    {sub.name ? `${sub.name} (${sub.phone})` : sub.phone}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Transfer */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <button
          onClick={() => setShowTransfer(!showTransfer)}
          className="flex items-center justify-between w-full"
        >
          <h2 className="font-semibold text-slate-800">Transfer Primary Contact</h2>
          <span className="text-slate-400 text-sm">{showTransfer ? 'Hide' : 'Show'}</span>
        </button>
        {showTransfer && (
          <form onSubmit={handleTransfer} className="mt-4 space-y-3">
            <p className="text-sm text-slate-500">
              Transfer your role to someone else. They must have logged in before.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={transferEmail}
                onChange={(e) => setTransferEmail(e.target.value)}
                placeholder="Their email address"
                required
                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
              <button
                type="submit"
                className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-600 transition"
              >
                Transfer
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function QuestionAnswer({ question, onAnswer }) {
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!answer.trim()) return
    setSubmitting(true)
    await onAnswer(question.id, answer.trim())
    setAnswer('')
    setSubmitting(false)
  }

  return (
    <div className="bg-white rounded-lg border border-amber-200 p-3">
      <p className="text-sm font-medium text-slate-800">Q: {question.question}</p>
      <p className="text-xs text-slate-400 mt-1">{question.author_name} &middot; {new Date(question.created_at).toLocaleString()}</p>
      <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
        <input
          type="text"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer..."
          required
          className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 transition disabled:opacity-50"
        >
          Answer
        </button>
      </form>
    </div>
  )
}
