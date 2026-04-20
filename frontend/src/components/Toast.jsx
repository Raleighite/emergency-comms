import { useState, useEffect } from 'react'

export default function Toast({ message, onDone }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(onDone, 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [onDone])

  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
      <div className="bg-slate-900 text-gray-100 px-5 py-3 rounded-xl shadow-lg text-sm font-medium">
        {message}
      </div>
    </div>
  )
}
