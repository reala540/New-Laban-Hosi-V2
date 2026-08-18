import { useEffect, useState } from 'react'
import { adminApi } from './adminApi'
import Login from './Login'
import Dashboard from './Dashboard'
import './admin.css'

type SessionState = 'checking' | 'signed-out' | 'signed-in'

export default function AdminApp() {
  const [session, setSession] = useState<SessionState>('checking')

  useEffect(() => {
    document.title = 'Staff Area'
    adminApi
      .get<{ authenticated: boolean }>('/api/admin/me')
      .then((d) => setSession(d.authenticated ? 'signed-in' : 'signed-out'))
      .catch(() => setSession('signed-out'))
  }, [])

  if (session === 'checking') {
    return (
      <div className="admin-root admin-center">
        <p className="admin-muted">Loading…</p>
      </div>
    )
  }

  if (session === 'signed-out') {
    return <Login onSuccess={() => setSession('signed-in')} />
  }

  return <Dashboard onSignOut={() => setSession('signed-out')} />
}
