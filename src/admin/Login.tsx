import { useState } from 'react'
import { adminApi } from './adminApi'

export default function Login({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await adminApi.post('/api/admin/login', { password })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-root admin-center">
      <form className="admin-login-card" onSubmit={submit}>
        <h1>The Laban Hospital</h1>
        <p className="admin-muted">Staff sign in</p>
        {error && <div className="admin-alert admin-alert-error">{error}</div>}
        <label className="admin-label" htmlFor="admin-password">Password</label>
        <input
          id="admin-password"
          className="admin-input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="admin-btn admin-btn-primary" type="submit" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
