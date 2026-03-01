export default function Button({
  children, onClick, variant = 'primary', size = 'md',
  disabled = false, className = '', type = 'button', ...props
}) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.97]'
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
    xl: 'px-8 py-4 text-lg',
  }
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 disabled:bg-indigo-300',
    secondary: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-400 disabled:opacity-50',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300',
    warning: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-400 disabled:bg-orange-300',
    ghost: 'text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 disabled:bg-green-300',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? 'cursor-not-allowed' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
