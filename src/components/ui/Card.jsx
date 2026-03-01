export default function Card({ children, className = '', onClick }) {
  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  )
}
