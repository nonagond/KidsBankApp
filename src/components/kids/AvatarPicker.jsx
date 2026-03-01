import { useRef } from 'react'
import { isImageUrl } from '../../lib/avatarStorage'

const AVATARS = [
  '🐱', '🐶', '🐼', '🦊', '🐸', '🦄',
  '🐧', '🦋', '🐝', '🐢', '🦁', '🐻',
  '🦖', '🐬', '🦅', '🌟', '🚀', '🎮',
  '⚽', '🎨', '🎵', '🦸', '🧸',
]

export default function AvatarPicker({ value, onChange, onImageSelect, imagePreview }) {
  const fileRef = useRef()

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) return
    if (onImageSelect) onImageSelect(file)
  }

  const hasImage = imagePreview || isImageUrl(value)

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Pick an avatar</label>
      <div className="grid grid-cols-8 gap-1.5">
        {AVATARS.map(a => (
          <button
            key={a}
            type="button"
            onClick={() => {
              onChange(a)
              if (onImageSelect) onImageSelect(null)
            }}
            className={`text-2xl p-1.5 rounded-xl transition-all ${
              value === a && !imagePreview
                ? 'bg-indigo-100 ring-2 ring-indigo-400 scale-110'
                : 'hover:bg-gray-100'
            }`}
          >
            {a}
          </button>
        ))}
        {onImageSelect && (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className={`text-2xl p-1.5 rounded-xl transition-all flex items-center justify-center ${
              hasImage
                ? 'bg-indigo-100 ring-2 ring-indigo-400 scale-110'
                : 'hover:bg-gray-100'
            }`}
          >
            {imagePreview ? (
              <img src={imagePreview} className="w-8 h-8 rounded-full object-cover" alt="Preview" />
            ) : isImageUrl(value) ? (
              <img src={value} className="w-8 h-8 rounded-full object-cover" alt="Current" />
            ) : (
              '📷'
            )}
          </button>
        )}
      </div>
      {onImageSelect && (
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
      )}
    </div>
  )
}
