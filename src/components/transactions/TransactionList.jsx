import TransactionItem from './TransactionItem'
import Spinner from '../ui/Spinner'

export default function TransactionList({ transactions, loading, onEdit, onDelete }) {
  if (loading) {
    return <div className="flex justify-center py-10"><Spinner /></div>
  }
  if (!transactions.length) {
    return (
      <div className="text-center py-10">
        <div className="text-4xl mb-2">📋</div>
        <p className="text-gray-400 text-sm">No transactions yet</p>
      </div>
    )
  }
  return (
    <div className="divide-y divide-gray-50">
      {transactions.map(t => <TransactionItem key={t.id} txn={t} onEdit={onEdit} onDelete={onDelete} />)}
    </div>
  )
}
