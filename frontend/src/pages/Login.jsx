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
  const [magicLink, setMagicLink] = useState('')
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
      if (res.data.magic_link) setMagicLink(res.data.magic_link)
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
    <div className="max-w-md mx-auto pt-8">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-gray-100 mb-8 text-center">Log in to your account</h1>

      {step === 'input' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-6">
          {smsAvailable && (
            <div className="flex mb-6 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
              <button
                onClick={() => setMode('email')}
                className={`flex-1 py-2.5 text-sm rounded-lg font-medium transition ${
                  mode === 'email' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-gray-100' : 'text-slate-500 dark:text-gray-400'
                }`}
              >
                Email
              </button>
              <button
                onClick={() => setMode('phone')}
                className={`flex-1 py-2.5 text-sm rounded-lg font-medium transition ${
                  mode === 'phone' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-gray-100' : 'text-slate-500 dark:text-gray-400'
                }`}
              >
                Phone (SMS)
              </button>
            </div>
          )}

          {mode === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-base"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition text-base"
              >
                Send Login Link
              </button>
              <p className="text-xs text-slate-500 dark:text-gray-500 text-center">
                We'll send a magic link to your inbox — no password needed.
              </p>
            </form>
          ) : (
            <form onSubmit={handleSmsSend} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5">Phone number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  required
                  className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 placeholder:text-slate-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-base"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition text-base"
              >
                Send Code
              </button>
            </form>
          )}
        </div>
      )}

      {step === 'email-sent' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-6 text-center">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-2">
            {magicLink ? 'Dev Mode' : 'Check your email'}
          </h2>
          <p className="text-slate-600 dark:text-gray-400 text-sm">{message}</p>
          {magicLink && (
            <a
              href={magicLink}
              className="mt-4 inline-block bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition"
            >
              Click here to log in
            </a>
          )}
        </div>
      )}

      {step === 'sms-code' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-6">
          <p className="text-sm text-slate-600 dark:text-gray-400 text-center mb-4">
            Code sent to <strong className="text-slate-900 dark:text-gray-100">{phone}</strong>
          </p>
          <form onSubmit={handleSmsVerify} className="space-y-4">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              required
              maxLength={6}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-gray-100 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none text-center text-xl tracking-[0.3em] font-mono"
            />
            <button
              type="submit"
              className="w-full bg-amber-500 text-white py-3 rounded-xl font-semibold hover:bg-amber-600 transition"
            >
              Verify
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
