export default function ConfirmModal({ title, message, confirmLabel = 'Confirm', onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-xl">
        <h3 className="text-lg font-bold text-slate-900 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-gray-400 mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-gray-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
