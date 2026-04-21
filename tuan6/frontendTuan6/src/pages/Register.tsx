import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../services'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const user = await authService.register(username, password)
      setMessage(`Register success: ${user.username}`)
      setTimeout(() => navigate('/login'), 700)
    } catch (err) {
      setError((err as Error).message || 'Register failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="container auth-wrap">
      <section className="card">
        <h1>Register</h1>
        <form onSubmit={onSubmit} className="form">
          <input
            placeholder="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            required
          />
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {message && <p className="feedback ok">{message}</p>}
          {error && <p className="feedback err">{error}</p>}
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p>
          Have account? <Link to="/login">Login</Link>
        </p>
      </section>
    </main>
  )
}
