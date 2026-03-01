import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import Button from '../ui/Button'

const FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export default function AllowanceForm({ schedule, onSave }) {
  const [amount, setAmount] = useState(schedule?.amount?.toString() ?? '')
  const [frequency, setFrequency] = useState(schedule?.frequency ?? 'weekly')
  const [active, setActive] = useState(schedule?.active ?? true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (schedule) {
      setAmount(schedule.amount?.toString() ?? '')
      setFrequency(schedule.frequency ?? 'weekly')
      setActive(schedule.active ?? true)
    }
  }, [schedule])

  async function handleSubmit(e) {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0) { setError('Enter a valid amount'); return }
    setSaving(true)
    setError('')
    const { error: err } = await onSave(num, frequency, active)
    setSaving(false)
    if (err) setError(err.message)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Allowance amount</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            value={amount}
            onChange={e => {
              const v = e.target.value
              if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) setAmount(v)
            }}
            placeholder="5.00"
            className="w-full border border-gray-300 rounded-xl pl-7 pr-3 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
        <div className="flex gap-2">
          {FREQUENCIES.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFrequency(f.value)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                frequency === f.value
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <span className="text-sm font-medium text-gray-700">Active</span>
          <p className="text-xs text-gray-400 mt-0.5">Auto-pay allowance on schedule</p>
        </div>
        <button
          type="button"
          onClick={() => setActive(a => !a)}
          className={`w-12 h-6 rounded-full transition-colors relative ${active ? 'bg-indigo-600' : 'bg-gray-200'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-6' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {schedule && (
        <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-500">
          Next payment:{' '}
          <span className="font-semibold text-gray-700">
            {schedule.next_payment_date
              ? format(parseISO(schedule.next_payment_date), 'MMMM d, yyyy')
              : '—'}
          </span>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <Button type="submit" className="w-full" size="lg" disabled={saving}>
        {saving ? 'Saving…' : schedule ? 'Update Allowance' : 'Set Allowance'}
      </Button>
    </form>
  )
}
