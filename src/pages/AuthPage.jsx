import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/ui/Button'

export default function AuthPage() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error: err } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password)
    setLoading(false)
    if (err) { setError(err.message); return }
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="text-7xl mb-3">🏦</div>
          <h1 className="text-2xl font-bold text-gray-900">KidsBank</h1>
          <p className="text-gray-400 text-sm mt-1">Teaching kids about money 💰</p>
        </div>

        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${isLogin ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            onClick={() => { setIsLogin(true); setError('') }}
          >
            Login
          </button>
          <button
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${!isLogin ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
            onClick={() => { setIsLogin(false); setError('') }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
            minLength={6}
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? 'Loading…' : isLogin ? 'Login' : 'Create Account'}
          </Button>
        </form>
      </div>
    </div>
  )
}
