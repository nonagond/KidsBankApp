import { useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { formatCurrency } from '../../lib/formatCurrency'
import { supabase } from '../../lib/supabase'
import { useFamily } from '../../context/FamilyContext'

export default function AccountTransferForm({ isOpen, onClose, kidId, accounts }) {
  const { refreshKids } = useFamily()
  const [fromId, setFromId] = useState(accounts[0]?.id || '')
  const [toId, setToId] = useState(accounts[1]?.id || '')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const fromAccount = accounts.find(a => a.id === fromId)
  const toAccount = accounts.find(a => a.id === toId)

  async function handleSubmit(e) {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0) { setError('Enter a valid amount'); return }
    if (fromId === toId) { setError('Select different accounts'); return }
    if (!fromAccount || num > Number(fromAccount.balance)) {
      setError(`Can't transfer more than ${formatCurrency(fromAccount?.balance ?? 0)}`)
      return
    }
    setError('')
    setSaving(true)

    // Withdraw from source account
    const { error: wErr } = await supabase.rpc('apply_transaction', {
      p_kid_id: kidId,
      p_amount: num,
      p_type: 'withdrawal',
      p_description: `Transfer to ${toAccount?.name}`,
      p_account_id: fromId,
    })
    if (wErr) {
      toast.error(wErr.message || 'Transfer failed')
      setSaving(false)
      return
    }

    // Deposit to destination account
    const { error: dErr } = await supabase.rpc('apply_transaction', {
      p_kid_id: kidId,
      p_amount: num,
      p_type: 'deposit',
      p_description: `Transfer from ${fromAccount?.name}`,
      p_account_id: toId,
    })
    setSaving(false)

    if (dErr) {
      toast.error('Withdrawal succeeded but deposit failed: ' + (dErr.message || 'Unknown error'))
    } else {
      toast.success(`${formatCurrency(num)} moved to ${toAccount?.name}!`)
    }

    await refreshKids()
    setAmount('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Transfer Between Accounts">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
          <select
            value={fromId}
            onChange={e => setFromId(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatCurrency(a.balance)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
          <select
            value={toId}
            onChange={e => setToId(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {accounts.filter(a => a.id !== fromId).map(a => (
              <option key={a.id} value={a.id}>
                {a.name} ({formatCurrency(a.balance)})
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
            {saving ? 'Transferring…' : 'Transfer'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
