import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useFamily } from '../context/FamilyContext'
import AvatarDisplay from '../components/kids/AvatarDisplay'
import { useTransactions } from '../hooks/useTransactions'
import { useAccounts } from '../hooks/useAccounts'
import { useGoals } from '../hooks/useGoals'
import { formatCurrency } from '../lib/formatCurrency'
import TransactionForm from '../components/transactions/TransactionForm'
import TransactionList from '../components/transactions/TransactionList'
import EditTransactionModal from '../components/transactions/EditTransactionModal'
import SendMoneyForm from '../components/transactions/SendMoneyForm'
import AccountSelector from '../components/accounts/AccountSelector'
import AccountManager from '../components/accounts/AccountManager'
import AccountTransferForm from '../components/accounts/AccountTransferForm'
import GoalCard from '../components/goals/GoalCard'
import GoalForm from '../components/goals/GoalForm'
import KidForm from '../components/kids/KidForm'
import Button from '../components/ui/Button'
import Spinner from '../components/ui/Spinner'

export default function KidDetailPage() {
  const { kidId } = useParams()
  const navigate = useNavigate()
  const { kids } = useFamily()
  const kid = kids.find(k => k.id === kidId)

  // Accounts
  const { accounts, loading: acctsLoading, addAccount, renameAccount, deleteAccount, refetch: refetchAccounts } = useAccounts(kidId)
  const [selectedAccountId, setSelectedAccountId] = useState(null)
  const [showAccountManager, setShowAccountManager] = useState(false)

  // Transactions (filtered by selected account)
  const { transactions, loading: txLoading, deleteTransaction, editTransaction, refetch: refetchTransactions } = useTransactions(kidId, selectedAccountId)
  const { goals, loading: goalsLoading, addGoal, transferToGoal, deleteGoal } = useGoals(kidId)

  // UI state
  const [txModal, setTxModal] = useState(null) // 'deposit' | 'withdrawal' | null
  const [sendModal, setSendModal] = useState(false)
  const [showAccountTransfer, setShowAccountTransfer] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [showEditKid, setShowEditKid] = useState(false)
  const [editingTxn, setEditingTxn] = useState(null)
  const [tab, setTab] = useState('transactions')

  // Display balance: selected account or total
  const displayBalance = selectedAccountId
    ? Number(accounts.find(a => a.id === selectedAccountId)?.balance ?? 0)
    : kid?.balance ?? 0

  const balanceLabel = selectedAccountId
    ? accounts.find(a => a.id === selectedAccountId)?.name ?? 'Account'
    : 'Total Balance'

  // Refresh all data after any ledger modification
  function refreshAll() {
    refetchAccounts()
    refetchTransactions()
  }

  async function handleDeleteTxn(txn) {
    const { error } = await deleteTransaction(txn.id)
    if (error) toast.error(error.message || 'Delete failed')
    else {
      toast.success('Transaction deleted')
      refetchAccounts()
    }
  }

  function handleEditTxn(txn) {
    setEditingTxn(txn)
  }

  async function handleSaveEdit(txnId, amount, type, description) {
    const result = await editTransaction(txnId, amount, type, description)
    if (!result.error) {
      toast.success('Transaction updated')
      refetchAccounts()
    }
    return result
  }

  async function handleGoalTransfer(goalId, amount) {
    const result = await transferToGoal(goalId, amount)
    if (!result.error) refetchAccounts()
    return result
  }

  if (!kid) {
    return <div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div>
  }

  return (
    <div className="pb-8">
      {/* Hero header */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white px-4 pt-12 pb-8 relative safe-top">
        <button
          onClick={() => navigate('/')}
          className="absolute left-4 text-white/80 hover:text-white text-sm font-medium flex items-center gap-1"
          style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}
        >
          ‹ Back
        </button>
        <div className="absolute right-4 flex gap-3" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}>
          {accounts.length > 0 && (
            <button
              onClick={() => setShowAccountManager(true)}
              className="text-white/70 hover:text-white text-sm font-medium"
              title="Manage accounts"
            >
              ⚙️
            </button>
          )}
          <button
            onClick={() => setShowEditKid(true)}
            className="text-white/70 hover:text-white text-sm font-medium"
          >
            Edit
          </button>
        </div>

        <div className="text-center">
          <div className="mb-2 flex justify-center"><AvatarDisplay avatar={kid.avatar} size="lg" /></div>
          <h2 className="text-xl font-bold">{kid.name}</h2>
          <p className="text-5xl font-bold mt-2 tabular-nums">{formatCurrency(displayBalance)}</p>
          <p className="text-white/60 text-sm mt-1">{balanceLabel}</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => setTxModal('deposit')}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors active:scale-95"
          >
            <span className="text-green-300 text-lg font-black" style={{ WebkitTextStroke: '1.5px' }}>↑</span> Deposit
          </button>
          <button
            onClick={() => setTxModal('withdrawal')}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors active:scale-95"
          >
            <span className="text-orange-300 text-lg font-black" style={{ WebkitTextStroke: '1.5px' }}>↓</span> Withdraw
          </button>
          {kids.length > 1 && (
            <button
              onClick={() => setSendModal(true)}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition-colors active:scale-95"
            >
              <span className="text-cyan-300 text-lg font-black" style={{ WebkitTextStroke: '1.5px' }}>→</span> Send
            </button>
          )}
          <button
            onClick={() => navigate(`/kids/${kidId}/allowance`)}
            className="bg-white/20 hover:bg-white/30 text-white font-semibold rounded-xl px-4 py-3 transition-colors active:scale-95"
            title="Allowance settings"
          >
            🪙
          </button>
        </div>
      </div>

      {/* Account selector */}
      {!acctsLoading && accounts.length > 1 && (
        <div className="flex items-center gap-1 mt-3 px-4">
          <div className="flex-1 overflow-x-auto">
            <AccountSelector
              accounts={accounts}
              selectedId={selectedAccountId}
              onSelect={setSelectedAccountId}
            />
          </div>
          <button
            onClick={() => setShowAccountTransfer(true)}
            className="shrink-0 px-2.5 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="Transfer between accounts"
          >
            ⇄ Move
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-gray-100 mx-4 mt-4 rounded-xl p-1">
        <button
          onClick={() => setTab('transactions')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'transactions' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
        >
          Ledger {transactions.length > 0 && `(${transactions.length})`}
        </button>
        <button
          onClick={() => setTab('goals')}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${tab === 'goals' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
        >
          Goals {goals.length > 0 && `(${goals.length})`}
        </button>
      </div>

      {/* Tab content */}
      <div className="px-4 mt-4">
        {tab === 'transactions' && (
          <TransactionList
            transactions={transactions}
            loading={txLoading}
            onEdit={handleEditTxn}
            onDelete={handleDeleteTxn}
          />
        )}

        {tab === 'goals' && (
          <div className="space-y-3">
            {goalsLoading ? (
              <div className="flex justify-center py-10"><Spinner /></div>
            ) : (
              <>
                {goals.length === 0 && (
                  <div className="text-center py-10">
                    <div className="text-4xl mb-2">🎯</div>
                    <p className="text-gray-400 text-sm">No savings goals yet</p>
                  </div>
                )}
                {goals.map(g => (
                  <GoalCard
                    key={g.id}
                    goal={g}
                    kidBalance={kid.balance}
                    onTransfer={handleGoalTransfer}
                    onDelete={deleteGoal}
                  />
                ))}
                <Button variant="secondary" className="w-full" onClick={() => setShowGoalForm(true)}>
                  + New Savings Goal
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {txModal && (
        <TransactionForm
          isOpen={true}
          onClose={() => { setTxModal(null); refreshAll() }}
          kidId={kidId}
          type={txModal}
          kidBalance={displayBalance}
          accounts={accounts}
          defaultAccountId={selectedAccountId}
        />
      )}

      {sendModal && (
        <SendMoneyForm
          isOpen={true}
          onClose={() => { setSendModal(false); refreshAll() }}
          sourceKid={kid}
          accounts={accounts}
          selectedAccountId={selectedAccountId}
        />
      )}

      {showAccountTransfer && (
        <AccountTransferForm
          isOpen={true}
          onClose={() => { setShowAccountTransfer(false); refreshAll() }}
          kidId={kidId}
          accounts={accounts}
        />
      )}

      {editingTxn && (
        <EditTransactionModal
          isOpen={true}
          onClose={() => setEditingTxn(null)}
          txn={editingTxn}
          onSave={handleSaveEdit}
        />
      )}

      <AccountManager
        isOpen={showAccountManager}
        onClose={() => { setShowAccountManager(false); refetchAccounts() }}
        accounts={accounts}
        onAdd={addAccount}
        onRename={renameAccount}
        onDelete={deleteAccount}
      />

      <GoalForm
        isOpen={showGoalForm}
        onClose={() => setShowGoalForm(false)}
        onSave={addGoal}
      />

      <KidForm
        isOpen={showEditKid}
        onClose={() => setShowEditKid(false)}
        kid={kid}
      />
    </div>
  )
}
