import { useEffect, useState, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function AuthVerify() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const verifiedRef = useRef(false)

  useEffect(() => {
    if (verifiedRef.current) return
    verifiedRef.current = true

    const token = searchParams.get('token')
    if (!token) {
      setError('Invalid link')
      return
    }

    api.post('/auth/magic-link/verify', { token })
      .then((res) => {
        login(res.data.token, res.data.user)
        navigate('/dashboard')
      })
      .catch((err) => {
        setError(err.response?.data?.error || 'This link is invalid or has expired.')
      })
  }, [searchParams, login, navigate])

  if (error) {
    return (
      <div className="max-w-md mx-auto pt-16 text-center">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-8">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-2">Link expired</h2>
          <p className="text-sm text-slate-600 dark:text-gray-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center pt-20">
      <div className="inline-block w-8 h-8 border-2 border-slate-300 dark:border-slate-600 border-t-amber-500 rounded-full animate-spin mb-4" />
      <p className="text-slate-500 dark:text-gray-400">Verifying your login...</p>
    </div>
  )
}
