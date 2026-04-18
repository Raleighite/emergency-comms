import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout({ children }) {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <nav className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold text-blue-600 hover:text-blue-700">
            Emergency Comms
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
                  Dashboard
                </Link>
                <Link to="/create" className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                  New Event
                </Link>
                <button
                  onClick={logout}
                  className="text-sm text-slate-500 hover:text-slate-700"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                Log in
              </Link>
            )}
          </div>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  )
}
