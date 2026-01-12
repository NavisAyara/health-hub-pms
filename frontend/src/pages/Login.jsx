import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('http://127.0.0.1:5000/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const body = await res.json()

      if (!res.ok || !body.success) {
        setError(body?.message || 'Login failed')
        setLoading(false)
        return
      }

      const { access_token, refresh_token, user } = body.data

      // Store tokens based on remember me preference
      const storage = rememberMe ? localStorage : sessionStorage
      storage.setItem('access_token', access_token)
      storage.setItem('refresh_token', refresh_token)
      storage.setItem('user', JSON.stringify(user))

      // Redirect based on role
      const role = user?.role
      if (role === 'admin') navigate('/admin')
      else if (role === 'patient') navigate('/patient')
      else if (role === 'healthcare_worker') navigate('/healthcare-worker')
      else navigate('/patient')

    } catch (err) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <form onSubmit={handleSubmit} className="w-full max-w-md bg-white rounded-lg shadow p-6 border-l-4 border-yellow-400">
        <h1 className="text-2xl font-semibold text-yellow-800 mb-4">Login</h1>

        {error && <div className="mb-3 text-sm text-red-600">{error}</div>}

        <label className="block mb-2">
          <span className="text-sm text-gray-700">Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full rounded border-gray-200 focus:border-yellow-400 focus:ring-yellow-200"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm text-gray-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full rounded border-gray-200 focus:border-yellow-400 focus:ring-yellow-200"
          />
        </label>

        <div className="flex items-center mb-4">
          <input
            id="remember-me"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
          />
          <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
            Remember me
          </label>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 ${loading ? 'opacity-60' : ''}`}
            disabled={loading}
          >
            {loading ? 'Logging in…' : 'Log in'}
          </button>

          <a href="/signup" className="text-sm text-yellow-800 hover:underline">Sign up</a>
        </div>
      </form>
    </div>
  )
}
