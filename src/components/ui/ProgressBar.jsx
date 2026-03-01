export default function ProgressBar({ current, target, className = '' }) {
  const pct = Math.min(100, target > 0 ? (current / target) * 100 : 0)
  return (
    <div className={`w-full bg-gray-100 rounded-full h-2.5 ${className}`}>
      <div
        className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
