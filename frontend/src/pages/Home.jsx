import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="py-12 sm:py-20">
      {/* Hero */}
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-gray-100 tracking-tight mb-4">
          One link. Everyone informed.
        </h1>
        <p className="text-lg text-slate-600 dark:text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed">
          When a loved one faces an emergency, the last thing you need is repeating
          the same update to twenty different people. Create one place for updates,
          share a link, and keep everyone in the loop.
        </p>
        <div className="flex justify-center gap-3">
          {user ? (
            <>
              <Link
                to="/create"
                className="bg-amber-500 text-white px-6 py-3.5 rounded-xl text-lg font-semibold hover:bg-amber-600 transition shadow-md"
              >
                Create an Event
              </Link>
              <Link
                to="/dashboard"
                className="bg-white dark:bg-slate-800 text-slate-700 dark:text-gray-300 px-6 py-3.5 rounded-xl text-lg font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
              >
                My Events
              </Link>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-amber-500 text-white px-8 py-3.5 rounded-xl text-lg font-semibold hover:bg-amber-600 transition shadow-md"
            >
              Get Started
            </Link>
          )}
        </div>
      </div>

      {/* How it works */}
      <div className="grid md:grid-cols-3 gap-5 mb-16">
        {[
          { step: '1', title: 'Create an Event', desc: 'Set up a page for your situation in seconds. You become the primary contact.' },
          { step: '2', title: 'Share the Link', desc: 'Text or email the link to family and friends. They can view updates without signing up.' },
          { step: '3', title: 'Post Updates', desc: 'Post updates as things change. Hand off the primary contact role if needed.' },
        ].map((item) => (
          <div key={item.step} className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-md dark:border dark:border-slate-800">
            <div className="w-9 h-9 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm mb-4">
              {item.step}
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-gray-100 mb-2">{item.title}</h3>
            <p className="text-slate-500 dark:text-gray-400 text-sm leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Tier callout */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-md dark:border dark:border-slate-800 p-6 sm:p-8 text-center">
        <h2 className="text-xl font-bold text-slate-900 dark:text-gray-100 mb-2">Free and open source</h2>
        <p className="text-slate-500 dark:text-gray-400 text-sm mb-4 max-w-md mx-auto">
          Email-based login, shareable events, and community contributions are always free.
          Need SMS notifications? Upgrade to Premium.
        </p>
        <div className="flex justify-center gap-3 text-sm">
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-gray-300 px-3 py-1.5 rounded-lg font-medium">Free: Email auth + updates</span>
          <span className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-lg font-medium">Premium: SMS alerts</span>
        </div>
      </div>
    </div>
  )
}
