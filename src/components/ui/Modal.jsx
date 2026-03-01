import { useEffect } from 'react'

export default function Modal({ isOpen, onClose, title, children }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-0 sm:p-4 sm:pt-12">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full sm:max-w-md bg-white rounded-b-3xl sm:rounded-2xl shadow-xl p-6 animate-slide-up">
        {title && (
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            {onClose && (
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 text-sm"
              >
                ✕
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
