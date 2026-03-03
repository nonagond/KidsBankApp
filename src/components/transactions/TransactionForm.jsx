import { useState } from 'react'
import toast from 'react-hot-toast'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useTransactions } from '../../hooks/useTransactions'
import AvatarDisplay from '../kids/AvatarDisplay'
import { useFamily } from '../../context/FamilyContext'
import { formatCurrency } from '../../lib/formatCurrency'
import { supabase } from '../../lib/supabase'

export default function TransactionForm({ isOpen, onClose, kidId, type, kidBalance, accounts, defaultAccountId }) {
  const { applyTransaction } = useTransactions(kidId)
  const { kids, refreshKids } = useFamily()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState(defaultAccountId || accounts?.[0]?.id || null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Multi-kid deposit
  const [multiKid, setMultiKid] = useState(false)
  const otherKids = kids.filter(k => k.id !== kidId)
  const [selectedKids, setSelectedKids] = useState([])

  const isDeposit = type === 'deposit'
  const hasMultipleAccounts = accounts && accounts.length > 1

  // Determine effective balance for withdrawal validation
  const effectiveBalance = selectedAccountId
    ? Number(accounts?.find(a => a.id === selectedAccountId)?.balance ?? kidBalance)
    : kidBalance

  function toggleKid(id) {
    setSelectedKids(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const num = parseFloat(amount)
    if (!num || num <= 0) { setError('Enter a valid amount'); return }
    if (!isDeposit && num > effectiveBalance) { setError(`Can't withdraw more than ${formatCurrency(effectiveBalance)}`); return }
    setError('')
    setSaving(true)

    // Apply to current kid
    const { error: err } = await applyTransaction(num, type, description || null, selectedAccountId)
    if (err) {
      toast.error(err.message || 'Transaction failed')
      setSaving(false)
      return
    }

    // Multi-kid deposit: also deposit to selected other kids
    if (isDeposit && multiKid && selectedKids.length > 0) {
      let failCount = 0
      for (const otherKidId of selectedKids) {
        const { error: otherErr } = await supabase.rpc('apply_transaction', {
          p_kid_id: otherKidId,
          p_amount: num,
          p_type: 'deposit',
          p_description: description || null,
        })
        if (otherErr) failCount++
      }
      await refreshKids()
      const totalKids = 1 + selectedKids.length - failCount
      toast.success(`+${formatCurrency(num)} deposited to ${totalKids} kid${totalKids > 1 ? 's' : ''}!`)
      if (failCount > 0) toast.error(`${failCount} deposit${failCount > 1 ? 's' : ''} failed`)
    } else {
      toast.success(isDeposit
        ? `+${formatCurrency(num)} deposited!`
        : `-${formatCurrency(num)} withdrawn`)
    }

    setSaving(false)
    setAmount('')
    setDescription('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isDeposit ? 'Deposit Money' : 'Withdraw Money'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {hasMultipleAccounts && !defaultAccountId && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
            <select
              value={selectedAccountId || ''}
              onChange={e => setSelectedAccountId(e.target.value || null)}
              className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({formatCurrency(a.balance)})
                </option>
              ))}
            </select>
          </div>
        )}
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
          <div className="flex flex-wrap gap-2 mt-2">
            {[0.25, 0.50, 1.00, 10.00].map(v => (
              <button
                key={v}
                type="button"
                onClick={() => {
                  const current = parseFloat(amount) || 0
                  setAmount((current + v).toFixed(2))
                }}
                className="px-3 py-1.5 text-sm font-medium bg-indigo-50 text-indigo-700 rounded-full hover:bg-indigo-100 active:bg-indigo-200 transition-colors"
              >
                +${v.toFixed(2)}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setAmount('')}
              className="px-3 py-1.5 text-sm font-medium bg-gray-100 text-gray-500 rounded-full hover:bg-gray-200 active:bg-gray-300 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
          <input
            type="text"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder={isDeposit ? 'Birthday money, chores…' : 'Spent on…'}
            className="w-full border border-gray-300 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Multi-kid deposit */}
        {isDeposit && otherKids.length > 0 && (
          <div>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={multiKid}
                  onChange={e => setMultiKid(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Deposit to multiple kids
                </span>
              </label>
              {multiKid && (
                <div className="flex gap-1 ml-auto">
                  <button
                    type="button"
                    onClick={() => setSelectedKids(otherKids.map(k => k.id))}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-800 px-2 py-0.5 rounded-md hover:bg-indigo-50 transition-colors"
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedKids([])}
                    className="text-xs font-medium text-gray-500 hover:text-gray-700 px-2 py-0.5 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    None
                  </button>
                </div>
              )}
            </div>

            {multiKid && (
              <div className="mt-3 ml-6 space-y-2 border-l-2 border-indigo-100 pl-3">
                {otherKids.map(k => (
                  <label key={k.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedKids.includes(k.id)}
                      onChange={() => toggleKid(k.id)}
                      className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600 flex items-center gap-1.5">
                      <AvatarDisplay avatar={k.avatar} size="xs" /> {k.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex gap-2 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={isDeposit ? 'success' : 'warning'}
            className="flex-1"
            disabled={saving}
          >
            {saving ? 'Processing…' : isDeposit ? '+ Deposit' : '− Withdraw'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
