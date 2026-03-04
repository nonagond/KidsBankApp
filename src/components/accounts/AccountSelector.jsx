import { formatCurrency } from '../../lib/formatCurrency'

export default function AccountSelector({ accounts, selectedId, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
          !selectedId ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      {accounts.map(a => (
        <button
          key={a.id}
          onClick={() => onSelect(a.id)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            selectedId === a.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {a.name} ({formatCurrency(a.balance)})
        </button>
      ))}
    </div>
  )
}
