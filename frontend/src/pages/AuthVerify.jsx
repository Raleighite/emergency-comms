import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api'

export default function AuthVerify() {
  const [searchParams] = useSearchParams()
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
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
      <div className="max-w-md mx-auto text-center">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Link expired</h2>
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="text-center py-16">
      <p className="text-slate-600">Verifying your login...</p>
    </div>
  )
}
