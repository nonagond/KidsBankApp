import { useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import AvatarDisplay from '../kids/AvatarDisplay'
import { useFamily } from '../../context/FamilyContext'
import { formatCurrency } from '../../lib/formatCurrency'
import { supabase } from '../../lib/supabase'

export default function SendMoneyForm({ isOpen, onClose, sourceKid, accounts, selectedAccountId }) {
  const { kids, refreshKids } = useFamily()
  const otherKids = kids.filter(k => k.id !== sourceKid.id)
  const [destKidId, setDestKidId] = useState(otherKids[0]?.id || '')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const sourceBalance = selectedAccountId
    ? Number(accounts?.find(a => a.id === selectedAccountId)?.balance ?? sourceKid.balance)
    : sourceKid.balance

  const destKid = kids.find(k => k.id === destKidId)

  async function handleSubmit(e) {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0) { setError('Enter a valid amount'); return }
    if (num > sourceBalance) { setError(`Can't send more than ${formatCurrency(sourceBalance)}`); return }
    if (!destKidId) { setError('Select a recipient'); return }
    setError('')
    setSaving(true)

    // Withdraw from source kid
    const withdrawParams = {
      p_kid_id: sourceKid.id,
      p_amount: num,
      p_type: 'withdrawal',
      p_description: `Sent ${formatCurrency(num)} to ${destKid.name}`,
    }
    if (selectedAccountId) withdrawParams.p_account_id = selectedAccountId

    const { error: wErr } = await supabase.rpc('apply_transaction', withdrawParams)
    if (wErr) {
      toast.error(wErr.message || 'Send failed')
      setSaving(false)
      return
    }

    // Deposit to destination kid
    const { error: dErr } = await supabase.rpc('apply_transaction', {
      p_kid_id: destKidId,
      p_amount: num,
      p_type: 'deposit',
      p_description: `Received ${formatCurrency(num)} from ${sourceKid.name}`,
    })

    setSaving(false)
    if (dErr) {
      toast.error('Withdrawal succeeded but deposit failed: ' + (dErr.message || 'Unknown error'))
    } else {
      toast.success(`${formatCurrency(num)} sent to ${destKid.name}!`)
    }

    await refreshKids()
    setAmount('')
    onClose()
  }

  if (otherKids.length === 0) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Send Money">
        <p className="text-sm text-gray-500 py-4">No other kids to send money to.</p>
        <Button variant="secondary" className="w-full" onClick={onClose}>Close</Button>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Send Money">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
            <AvatarDisplay avatar={sourceKid.avatar} size="sm" />
            <span className="font-medium text-gray-900">{sourceKid.name}</span>
            <span className="text-gray-400 ml-auto text-sm">{formatCurrency(sourceBalance)}</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <select
            value={destKidId}
            onChange={e => setDestKidId(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {otherKids.map(k => (
              <option key={k.id} value={k.id}>
                {k.name} ({formatCurrency(k.balance)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
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
              placeholder="0.00"
              className="w-full border border-gray-300 rounded-xl pl-7 pr-3 py-3 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Sending…' : 'Send'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
