import { format, parseISO } from 'date-fns'
import { formatCurrency } from '../../lib/formatCurrency'

const TYPE_CONFIG = {
  deposit:       { icon: '↑', iconColor: 'text-green-600 bg-green-50',  color: 'text-green-600',  label: 'Deposit',       sign: '+', stroke: '1.5px' },
  withdrawal:    { icon: '↓', iconColor: 'text-orange-500 bg-orange-50', color: 'text-orange-500', label: 'Withdrawal',    sign: '-', stroke: '1.5px' },
  allowance:     { icon: '🪙', iconColor: '',                             color: 'text-indigo-600', label: 'Allowance',     sign: '+' },
  goal_transfer: { icon: '🎯', iconColor: '',                             color: 'text-purple-600', label: 'Goal Transfer', sign: '-' },
}

export default function TransactionItem({ txn, onEdit, onDelete }) {
  const cfg = TYPE_CONFIG[txn.type] ?? TYPE_CONFIG.deposit
  const date = parseISO(txn.created_at)
  return (
    <div className="flex items-center gap-3 py-3">
      <div className={`text-2xl select-none ${cfg.iconColor ? 'w-9 h-9 rounded-full flex items-center justify-center font-black ' + cfg.iconColor : ''}`} style={cfg.stroke ? { WebkitTextStroke: cfg.stroke } : undefined}>{cfg.icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {txn.description || cfg.label}
        </p>
        <p className="text-xs text-gray-400">
          {format(date, 'MMM d, yyyy · h:mm a')}
          {txn.account?.name && txn.account.name !== 'Default' && ` · ${txn.account.name}`}
        </p>
      </div>
      <p className={`font-bold text-sm tabular-nums ${cfg.color}`}>
        {cfg.sign}{formatCurrency(txn.amount)}
      </p>
      {(onEdit || onDelete) && (
        <div className="flex gap-0.5 shrink-0">
          {onEdit && (
            <button
              onClick={() => onEdit(txn)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 text-xs transition-colors"
            >
              ✏️
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(txn)}
              className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-400 text-xs transition-colors"
            >
              🗑️
            </button>
          )}
        </div>
      )}
    </div>
  )
}
