import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Layout({ children }) {
  const { user, logout } = useAuth()
  const { dark, toggle } = useTheme()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors">
      <nav className="bg-slate-900 dark:bg-slate-900 border-b border-slate-800">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-lg font-bold text-white tracking-tight">
            Emergency Comms
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggle}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              aria-label="Toggle dark mode"
            >
              {dark ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            {user ? (
              <>
                <Link to="/dashboard" className="text-sm text-slate-300 hover:text-white transition py-2 px-2">
                  Dashboard
                </Link>
                <Link to="/create" className="text-sm font-medium bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 transition">
                  New Event
                </Link>
                <button
                  onClick={logout}
                  className="text-sm text-slate-400 hover:text-white transition py-2 px-2"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link to="/login" className="text-sm font-medium bg-amber-500 text-white px-4 py-2 rounded-xl hover:bg-amber-600 transition">
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
