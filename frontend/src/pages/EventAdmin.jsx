import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { eventApi, getEventPassword } from '../api'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'

const MAX_UPDATE_LENGTH = 2000

export default function EventAdmin() {
  const { accessCode } = useParams()
  const [event, setEvent] = useState(null)
  const [questions, setQuestions] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState(() => localStorage.getItem(`draft_${accessCode}`) || '')
  const [transferEmail, setTransferEmail] = useState('')
  const [showTransferConfirm, setShowTransferConfirm] = useState(false)
  const [subscriberPhone, setSubscriberPhone] = useState('')
  const [subscriberName, setSubscriberName] = useState('')
  const [subscribers, setSubscribers] = useState([])
  const [inviteEmail, setInviteEmail] = useState('')
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const [posting, setPosting] = useState(false)
  const [showSubscribers, setShowSubscribers] = useState(false)
  const { user } = useAuth()
  const navigate = useNavigate()
  const api = eventApi(accessCode)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    fetchEvent()
    fetchQuestions()
  }, [user, accessCode, navigate])

  // Auto-save draft
  useEffect(() => {
    localStorage.setItem(`draft_${accessCode}`, message)
  }, [message, accessCode])

  const fetchEvent = () => {
    api.get(`/events/${accessCode}`)
      .then((res) => {
        setEvent(res.data)
        if (res.data.primary_contact_id !== user?.id) navigate(`/e/${accessCode}`)
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false))
  }

  const fetchQuestions = () => {
    api.get(`/events/${accessCode}/questions`).then((res) => setQuestions(res.data)).catch(() => {})
  }

  const fetchSubscribers = () => {
    api.get(`/events/${accessCode}/subscribers`).then((res) => setSubscribers(res.data)).catch(() => {})
  }

  const handlePostUpdate = async (e) => {
    e.preventDefault()
    setError('')
    setPosting(true)
    try {
      await api.post(`/events/${accessCode}/updates`, { message })
      setMessage('')
      localStorage.removeItem(`draft_${accessCode}`)
      setToast('Update posted')
      fetchEvent()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to post update')
    } finally {
      setPosting(false)
    }
  }

  const handleTransfer = async () => {
    setShowTransferConfirm(false)
    try {
      await api.post(`/events/${accessCode}/transfer`, { email: transferEmail })
      setToast('Primary contact transferred')
      setTimeout(() => navigate(`/e/${accessCode}`), 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to transfer')
    }
  }

  const handleAddSubscriber = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/events/${accessCode}/subscribers`, { phone: subscriberPhone, name: subscriberName })
      setSubscriberPhone('')
      setSubscriberName('')
      fetchSubscribers()
      setToast('Subscriber added')
    } catch (err) { setError(err.response?.data?.error || 'Failed to add subscriber') }
  }

  const handleInviteEmail = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post(`/events/${accessCode}/invite-email`, { email: inviteEmail })
      setInviteEmail('')
      setToast(res.data.message)
    } catch (err) { setError(err.response?.data?.error || 'Failed to send invite') }
  }

  const handleAnswerQuestion = async (questionId, answer) => {
    try {
      await api.post(`/events/${accessCode}/questions/${questionId}/answer`, { answer })
      fetchQuestions()
      setToast('Question answered')
    } catch (err) { setError(err.response?.data?.error || 'Failed to answer') }
  }

  const copyShareLink = () => {
    const password = getEventPassword(accessCode)
    navigator.clipboard.writeText(`${window.location.origin}/e/${accessCode}?p=${encodeURIComponent(password)}`)
    setToast('Link copied — password included')
  }

  if (loading) return <div className="text-center pt-12"><div className="inline-block w-8 h-8 border-2 border-slate-300 dark:border-slate-600 border-t-amber-500 rounded-full animate-spin" /></div>

  const pendingQuestions = questions?.questions.filter(q => q.status === 'pending') || []

  return (
    <div className="max-w-2xl mx-auto">
      {toast && <Toast message={toast} onDone={() => setToast('')} />}
      {showTransferConfirm && (
        <ConfirmModal
          title="Transfer Primary Contact"
          message={`Are you sure you want to transfer the primary contact role to ${transferEmail}? You will no longer be able to post updates.`}
          confirmLabel="Transfer"
          onConfirm={handleTransfer}
          onCancel={() => setShowTransferConfirm(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-gray-100">{event?.name}</h1>
          <p className="text-sm text-slate-500 dark:text-gray-400">You are the primary contact</p>
        </div>
        <div className="flex gap-2">
          <button onClick={copyShareLink} className="text-sm font-medium bg-amber-500 text-white px-4 py-2.5 rounded-xl hover:bg-amber-600 transition">
            Copy Link
          </button>
          <Link to={`/e/${accessCode}`} className="text-sm font-medium text-slate-600 dark:text-gray-400 bg-slate-100 dark:bg-slate-800 px-3 py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition">
            View
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}

      {/* Medical Details */}
      {event?.template === 'medical_emergency' && (
        <MedicalDetailsEditor accessCode={accessCode} details={event.details || {}} api={api}
          onSaved={(details) => { setEvent({ ...event, details }); setToast('Details updated') }}
          onError={(msg) => setError(msg)} />
      )}

      {/* Attachment Upload */}
      <AttachmentUploader accessCode={accessCode} api={api}
        onUploaded={() => setToast('File uploaded')}
        onError={(msg) => setError(msg)} />

      {/* Post Update */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-5 mb-5">
        <h2 className="font-semibold text-slate-900 dark:text-gray-100 mb-3">Post an Update</h2>
        <form onSubmit={handlePostUpdate} className="space-y-3">
          <div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="What's the latest?"
              required
              maxLength={MAX_UPDATE_LENGTH}
              rows={4}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
            />
            <div className="flex justify-between mt-1">
              <p className="text-xs text-slate-400 dark:text-gray-500">Draft auto-saved</p>
              <p className={`text-xs ${message.length > MAX_UPDATE_LENGTH * 0.9 ? 'text-amber-600' : 'text-slate-400 dark:text-gray-500'}`}>
                {message.length}/{MAX_UPDATE_LENGTH}
              </p>
            </div>
          </div>
          <button type="submit" disabled={posting || !message.trim()} className="bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-50">
            {posting ? 'Posting...' : 'Post Update'}
          </button>
        </form>
      </div>

      {/* Pending Questions */}
      {pendingQuestions.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/15 rounded-2xl border border-amber-200 dark:border-amber-800 p-5 mb-5">
          <h2 className="font-semibold text-amber-900 dark:text-amber-300 mb-3">Questions to Answer ({pendingQuestions.length})</h2>
          <div className="space-y-3">
            {pendingQuestions.map((q) => (
              <QuestionAnswer key={q.id} question={q} onAnswer={handleAnswerQuestion} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Updates */}
      <div className="mb-5">
        <h2 className="text-sm font-semibold text-slate-800 dark:text-gray-200 uppercase tracking-wide mb-3">Recent Updates</h2>
        {(!event?.updates || event.updates.length === 0) ? (
          <p className="text-slate-500 dark:text-gray-400 text-sm">No updates yet.</p>
        ) : (
          <div className="space-y-3">
            {event.updates.map((update) => (
              <div key={update.id} className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-4 border-l-4 border-l-blue-400">
                <p className="text-slate-900 dark:text-gray-100 whitespace-pre-wrap">{update.message}</p>
                <p className="text-xs text-slate-400 dark:text-gray-500 mt-2">{new Date(update.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite by Email */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-5 mb-5">
        <h2 className="font-semibold text-slate-900 dark:text-gray-100 mb-1">Invite by Email</h2>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-3">Send an email with the event link.</p>
        <form onSubmit={handleInviteEmail} className="flex gap-2">
          <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="friend@example.com" required
            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm" />
          <button type="submit" className="bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition">Send</button>
        </form>
      </div>

      {/* SMS Subscribers (Premium) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-5 mb-5">
        <button onClick={() => { setShowSubscribers(!showSubscribers); if (!showSubscribers) fetchSubscribers() }} className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-slate-900 dark:text-gray-100">SMS Subscribers</h2>
            <span className="text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">Premium</span>
          </div>
          <svg className={`w-5 h-5 text-slate-400 transition ${showSubscribers ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
        </button>
        {showSubscribers && (
          <div className="mt-4 space-y-4">
            <form onSubmit={handleAddSubscriber} className="flex gap-2">
              <input type="text" value={subscriberName} onChange={(e) => setSubscriberName(e.target.value)} placeholder="Name"
                className="flex-1 px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 outline-none text-sm" />
              <input type="tel" value={subscriberPhone} onChange={(e) => setSubscriberPhone(e.target.value)} placeholder="Phone" required
                className="flex-1 px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 outline-none text-sm" />
              <button type="submit" className="bg-amber-500 text-white px-3 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition">Add</button>
            </form>
            {subscribers.length > 0 && (
              <ul className="space-y-1">
                {subscribers.map((sub, i) => (
                  <li key={i} className="text-sm text-slate-600 dark:text-gray-400">{sub.name ? `${sub.name} (${sub.phone})` : sub.phone}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Transfer */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-5">
        <h2 className="font-semibold text-slate-900 dark:text-gray-100 mb-1">Transfer Primary Contact</h2>
        <p className="text-sm text-slate-500 dark:text-gray-400 mb-3">Hand off to someone else. They must have logged in before.</p>
        <form onSubmit={(e) => { e.preventDefault(); if (transferEmail.trim()) setShowTransferConfirm(true) }} className="flex gap-2">
          <input type="email" value={transferEmail} onChange={(e) => setTransferEmail(e.target.value)} placeholder="Their email address" required
            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-sm" />
          <button type="submit" className="bg-amber-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition">Transfer</button>
        </form>
      </div>
    </div>
  )
}

function MedicalDetailsEditor({ accessCode, details, api, onSaved, onError }) {
  const [form, setForm] = useState({
    patient_status: details.patient_status || '',
    hospital_name: details.hospital_name || '',
    hospital_address: details.hospital_address || '',
    room_number: details.room_number || '',
    visitor_limits: details.visitor_limits || '',
    notes: details.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const update = (field, value) => setForm({ ...form, [field]: value })

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await api.post(`/events/${accessCode}/details`, form)
      onSaved(res.data.details)
    } catch (err) { onError(err.response?.data?.error || 'Failed to save') }
    finally { setSaving(false) }
  }

  const inputCls = "w-full px-4 py-2.5 border border-blue-200 dark:border-blue-800 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 outline-none text-sm"

  return (
    <div className="bg-blue-50 dark:bg-blue-900/15 rounded-2xl border border-blue-200 dark:border-blue-800 p-5 mb-5">
      <h2 className="font-semibold text-blue-900 dark:text-blue-300 mb-3">Medical Details</h2>
      <form onSubmit={handleSave} className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Patient Status</label>
          <input type="text" value={form.patient_status} onChange={(e) => update('patient_status', e.target.value)} placeholder='"In surgery", "Stable in ICU"' className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Hospital</label>
            <input type="text" value={form.hospital_name} onChange={(e) => update('hospital_name', e.target.value)} placeholder="Hospital name" className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Room / Bed</label>
            <input type="text" value={form.room_number} onChange={(e) => update('room_number', e.target.value)} placeholder="Room 302" className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Hospital Address</label>
          <input type="text" value={form.hospital_address} onChange={(e) => update('hospital_address', e.target.value)} placeholder="Full address" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Visitor Restrictions</label>
          <input type="text" value={form.visitor_limits} onChange={(e) => update('visitor_limits', e.target.value)} placeholder='"2 visitors at a time"' className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-blue-700 dark:text-blue-400 mb-1">Notes</label>
          <textarea value={form.notes} onChange={(e) => update('notes', e.target.value)} placeholder="Additional info..." rows={3} className={`${inputCls} resize-none`} />
        </div>
        <button type="submit" disabled={saving} className="bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Details'}
        </button>
      </form>
    </div>
  )
}

function AttachmentUploader({ accessCode, api, onUploaded, onError }) {
  const handleFileChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        await api.post(`/events/${accessCode}/attachments`, { filename: file.name, content_type: file.type, data: reader.result.split(',')[1] })
        onUploaded()
        e.target.value = ''
      } catch (err) { onError(err.response?.data?.error || 'Failed to upload') }
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-5 mb-5">
      <h2 className="font-semibold text-slate-900 dark:text-gray-100 mb-1">Upload Attachment</h2>
      <p className="text-sm text-slate-500 dark:text-gray-400 mb-3">Images or files relevant to the situation.</p>
      <input type="file" accept="image/*,.pdf,.doc,.docx" onChange={handleFileChange}
        className="text-sm text-slate-600 dark:text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-amber-50 dark:file:bg-amber-900/20 file:text-amber-700 dark:file:text-amber-400 hover:file:bg-amber-100 dark:hover:file:bg-amber-900/30 file:cursor-pointer" />
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
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-amber-800 p-3">
      <p className="text-sm font-medium text-slate-800 dark:text-gray-200">Q: {question.question}</p>
      <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">{question.author_name} &middot; {new Date(question.created_at).toLocaleString()}</p>
      <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
        <input type="text" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Type your answer..." required
          className="flex-1 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 outline-none text-sm" />
        <button type="submit" disabled={submitting} className="bg-green-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-green-700 transition disabled:opacity-50">Answer</button>
      </form>
    </div>
  )
}
