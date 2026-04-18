import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function Login() {
  const [mode, setMode] = useState('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('input')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [smsAvailable, setSmsAvailable] = useState(false)
  const { user, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/dashboard')
  }, [user, navigate])

  useEffect(() => {
    api.get('/auth/sms/available')
      .then((res) => setSmsAvailable(res.data.available))
      .catch(() => {})
  }, [])

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/magic-link', { email })
      setMessage(res.data.message)
      setStep('email-sent')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
  }

  const handleSmsSend = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/sms/send', { phone })
      setMessage(res.data.message)
      setStep('sms-code')
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
  }

  const handleSmsVerify = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/auth/sms/verify', { phone, code })
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid code')
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 text-center">Log In</h1>

      {step === 'input' && (
        <>
          {smsAvailable && (
            <div className="flex mb-6 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setMode('email')}
                className={`flex-1 py-2 text-sm rounded-md font-medium transition ${
                  mode === 'email' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setMode('phone')}
                className={`flex-1 py-2 text-sm rounded-md font-medium transition ${
                  mode === 'phone' ? 'bg-white shadow text-slate-900' : 'text-slate-500'
                }`}
              >
                Phone (SMS)
              </button>
            </div>
          )}

          {mode === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Send Login Link
              </button>
              <p className="text-xs text-slate-500 text-center">
                We'll send you a magic link to log in — no password needed.
              </p>
            </form>
          ) : (
            <form onSubmit={handleSmsSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phone number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  required
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
              >
                Send Code
              </button>
            </form>
          )}
        </>
      )}

      {step === 'email-sent' && (
        <div className="text-center bg-green-50 border border-green-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-green-800 mb-2">Check your email</h2>
          <p className="text-green-700 text-sm">
            We sent a login link to <strong>{email}</strong>. Click the link to log in.
            The link expires in 15 minutes.
          </p>
        </div>
      )}

      {step === 'sms-code' && (
        <form onSubmit={handleSmsVerify} className="space-y-4">
          <p className="text-sm text-slate-600 text-center">
            We sent a code to <strong>{phone}</strong>
          </p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Verification code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
              maxLength={6}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-center text-lg tracking-widest"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Verify
          </button>
        </form>
      )}

      {error && (
        <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
