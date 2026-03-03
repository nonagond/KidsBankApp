import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { formatCurrency } from '../../lib/formatCurrency'

export default function AccountManager({ isOpen, onClose, accounts, onAdd, onRename, onDelete }) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [error, setError] = useState('')

  async function handleAdd(e) {
    e.preventDefault()
    if (!newName.trim()) return
    const { error: err } = await onAdd(newName.trim())
    if (err) { setError(err.message); return }
    setNewName('')
    setError('')
  }

  async function handleRename(accountId) {
    if (!editName.trim()) return
    const { error: err } = await onRename(accountId, editName.trim())
    if (err) { setError(err.message); return }
    setEditingId(null)
    setEditName('')
    setError('')
  }

  async function handleDelete(accountId) {
    const { error: err } = await onDelete(accountId)
    if (err) { setError(err.message); return }
    setError('')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Accounts">
      <div className="space-y-3 mb-5">
        {accounts.map(a => (
          <div key={a.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
            {editingId === a.id ? (
              <>
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                  onKeyDown={e => e.key === 'Enter' && handleRename(a.id)}
                />
                <button
                  onClick={() => handleRename(a.id)}
                  className="text-indigo-600 text-sm font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditingId(null); setEditName('') }}
                  className="text-gray-400 text-sm"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-gray-900 truncate">{a.name}</span>
                    {a.is_default && (
                      <span className="text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-medium">
                        Main
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{formatCurrency(a.balance)}</p>
                </div>
                <button
                  onClick={() => { setEditingId(a.id); setEditName(a.name) }}
                  className="text-gray-400 hover:text-gray-600 text-xs"
                >
                  Rename
                </button>
                {!a.is_default && (
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-red-400 hover:text-red-600 text-xs"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New account name"
          className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <Button type="submit" disabled={!newName.trim()}>
          + Add
        </Button>
      </form>
    </Modal>
  )
}
