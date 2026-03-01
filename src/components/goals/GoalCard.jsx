import { useState } from 'react'
import toast from 'react-hot-toast'
import Card from '../ui/Card'
import ProgressBar from '../ui/ProgressBar'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { formatCurrency } from '../../lib/formatCurrency'

export default function GoalCard({ goal, kidBalance, onTransfer, onDelete }) {
  const [transferAmount, setTransferAmount] = useState('')
  const [showTransfer, setShowTransfer] = useState(false)
  const [saving, setSaving] = useState(false)
  const pct = Math.min(100, goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0)
  const remaining = Math.max(0, goal.target_amount - goal.current_amount)

  async function handleTransfer(e) {
    e.preventDefault()
    const num = parseFloat(transferAmount)
    if (!num || num <= 0) return
    if (num > kidBalance) { toast.error('Insufficient balance'); return }

    setSaving(true)
    const { error } = await onTransfer(goal.id, num)
    setSaving(false)
    if (error) {
      toast.error(error.message || 'Transfer failed')
    } else {
      toast.success(`${formatCurrency(num)} added to "${goal.name}"!`)
      setTransferAmount('')
      setShowTransfer(false)
    }
  }

  return (
    <>
      <Card className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-bold text-gray-900">🎯 {goal.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
              {goal.completed && ' · ✅ Complete!'}
            </p>
          </div>
          <div className="flex gap-1 ml-2 shrink-0">
            {!goal.completed && (
              <Button size="sm" variant="ghost" onClick={() => setShowTransfer(true)}>
                Add $
              </Button>
            )}
            <button
              onClick={() => onDelete(goal.id)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-red-400 text-sm"
            >
              ✕
            </button>
          </div>
        </div>
        <ProgressBar current={goal.current_amount} target={goal.target_amount} />
        <div className="flex justify-between mt-1.5">
          <p className="text-xs text-gray-400">
            {goal.completed ? 'Goal reached!' : `${formatCurrency(remaining)} to go`}
          </p>
          <p className="text-xs font-semibold text-indigo-600">{Math.round(pct)}%</p>
        </div>
      </Card>

      {/* Transfer modal */}
      <Modal isOpen={showTransfer} onClose={() => setShowTransfer(false)} title={`Add to "${goal.name}"`}>
        <form onSubmit={handleTransfer} className="space-y-4">
          <p className="text-sm text-gray-500">
            Available: <span className="font-semibold text-gray-700">{formatCurrency(kidBalance)}</span>
            {remaining > 0 && (
              <> · Need: <span className="font-semibold text-indigo-600">{formatCurrency(remaining)}</span></>
            )}
          </p>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">$</span>
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={transferAmount}
              onChange={e => {
                const v = e.target.value
                if (v === '' || /^\d*\.?\d{0,2}$/.test(v)) setTransferAmount(v)
              }}
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-xl pl-7 pr-3 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1" onClick={() => setShowTransfer(false)}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={saving}>
              {saving ? 'Saving…' : 'Transfer'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
