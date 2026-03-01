import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'

export default function GoalForm({ isOpen, onClose, onSave }) {
  const [name, setName] = useState('')
  const [target, setTarget] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Goal name required'); return }
    const num = parseFloat(target)
    if (!num || num <= 0) { setError('Enter a valid target amount'); return }
    setSaving(true)
    const { error: err } = await onSave(name.trim(), num)
    setSaving(false)
    if (err) { setError(err.message); return }
    setName('')
    setTarget('')
    setError('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Savings Goal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">What are you saving for?</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="New bike, PS5, trip to Disney…"
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={target}
              onChange={e => {
                const v = e.target.value
                if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) setTarget(v)
              }}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-xl pl-7 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Creating…' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
