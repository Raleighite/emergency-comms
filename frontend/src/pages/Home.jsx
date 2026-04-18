import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold text-slate-900 mb-4">
        Keep Everyone Updated
      </h1>
      <p className="text-lg text-slate-600 max-w-xl mx-auto mb-8">
        When a loved one is in the hospital or facing an emergency, the last thing you
        need is to repeat the same update to 20 different people. Create one place for
        updates, share a link, and keep everyone informed.
      </p>
      <div className="flex justify-center gap-4">
        {user ? (
          <>
            <Link
              to="/create"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition"
            >
              Create an Event
            </Link>
            <Link
              to="/dashboard"
              className="bg-white text-slate-700 px-6 py-3 rounded-lg text-lg font-medium border border-slate-300 hover:bg-slate-50 transition"
            >
              My Events
            </Link>
          </>
        ) : (
          <Link
            to="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
        )}
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-8 text-left">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-2xl mb-3">1.</div>
          <h3 className="font-semibold text-slate-900 mb-2">Create an Event</h3>
          <p className="text-slate-600 text-sm">
            Set up a page for your situation in seconds. You're the primary contact.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-2xl mb-3">2.</div>
          <h3 className="font-semibold text-slate-900 mb-2">Share the Link</h3>
          <p className="text-slate-600 text-sm">
            Text the link to friends and family. They can view updates without logging in.
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="text-2xl mb-3">3.</div>
          <h3 className="font-semibold text-slate-900 mb-2">Post Updates</h3>
          <p className="text-slate-600 text-sm">
            Post updates as things change. Everyone sees them instantly. Hand off the role if needed.
          </p>
        </div>
      </div>
    </div>
  )
}
