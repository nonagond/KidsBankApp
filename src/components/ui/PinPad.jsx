import { useState } from 'react'
import Modal from './Modal'

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓']

export default function PinPad({ isOpen, onSubmit, onCancel, hasError }) {
  const [pin, setPin] = useState('')

  function handleDigit(d) {
    if (d === '⌫') {
      setPin(p => p.slice(0, -1))
    } else if (d === '✓') {
      if (pin.length === 4) { onSubmit(pin); setPin('') }
    } else if (pin.length < 4) {
      const newPin = pin + d
      setPin(newPin)
      if (newPin.length === 4) {
        setTimeout(() => { onSubmit(newPin); setPin('') }, 150)
      }
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="Parent PIN">
      <div className="text-center">
        <p className="text-gray-500 text-sm mb-6">Enter your 4-digit PIN to continue</p>

        {/* Dot indicators */}
        <div className={`flex justify-center gap-4 mb-8 ${hasError ? 'animate-shake' : ''}`}>
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-150 ${
                i < pin.length
                  ? hasError ? 'bg-red-500 scale-125' : 'bg-indigo-600 scale-125'
                  : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Digit grid */}
        <div className="grid grid-cols-3 gap-3">
          {DIGITS.map(d => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className={`
                h-14 rounded-xl text-xl font-semibold transition-all active:scale-95
                ${d === '✓' && pin.length === 4 ? 'bg-indigo-600 text-white' : ''}
                ${d === '✓' && pin.length < 4 ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : ''}
                ${d === '⌫' ? 'bg-gray-100 text-red-500 hover:bg-gray-200' : ''}
                ${!['⌫', '✓'].includes(d) ? 'bg-gray-100 text-gray-800 hover:bg-gray-200' : ''}
              `}
            >
              {d}
            </button>
          ))}
        </div>

        {hasError && (
          <p className="mt-4 text-red-500 text-sm font-medium">Incorrect PIN. Try again.</p>
        )}
      </div>
    </Modal>
  )
}
