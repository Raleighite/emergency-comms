import { useState } from 'react'

export default function Onboarding({ accessCode, onDismiss }) {
  const [step, setStep] = useState(0)

  const steps = [
    {
      title: 'Welcome',
      body: 'This page is a central place for updates about a loved one. The primary contact will post updates here so everyone stays informed.',
    },
    {
      title: 'Save This Link',
      body: 'Bookmark this page or save it to your home screen so you can check back quickly. On iPhone: tap Share then "Add to Home Screen." On Android: tap the menu then "Add to Home screen."',
    },
    {
      title: 'Contribute & Ask Questions',
      body: 'You can share helpful info with the group (like "I can bring dinner") and ask the primary contact questions. You\'ll see your place in the question queue.',
    },
  ]

  const current = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-7 shadow-xl">
        <div className="flex gap-1.5 mb-6">
          {steps.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`}
            />
          ))}
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-gray-100 mb-2">{current.title}</h2>
        <p className="text-slate-600 dark:text-gray-400 text-sm leading-relaxed mb-8">{current.body}</p>

        <div className="flex justify-between items-center">
          {step > 0 ? (
            <button onClick={() => setStep(step - 1)} className="text-sm text-slate-500 dark:text-gray-400 hover:text-slate-700 dark:hover:text-gray-200 transition py-2 px-3">
              Back
            </button>
          ) : <div />}
          <button
            onClick={() => {
              if (isLast) {
                localStorage.setItem(`onboarding_${accessCode}`, 'done')
                onDismiss()
              } else {
                setStep(step + 1)
              }
            }}
            className="bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-600 transition"
          >
            {isLast ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
