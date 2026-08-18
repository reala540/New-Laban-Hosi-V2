import { useState } from 'react'
import { adminApi } from './adminApi'

export default function PasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setNotice('')
    setError('')
    if (newPassword !== confirm) {
      setError('The two new passwords do not match.')
      return
    }
    setBusy(true)
    try {
      await adminApi.post('/api/admin/password', { currentPassword, newPassword })
      setNotice('Password changed. Use the new password next time you sign in.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not change password')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="admin-card">
      <h2>Change Password</h2>
      <p className="admin-muted">
        Choose a password at least 10 characters long. Write it down somewhere safe — there is no
        &quot;forgot password&quot; option.
      </p>

      {notice && <div className="admin-alert admin-alert-ok">{notice}</div>}
      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      <form className="admin-form" onSubmit={submit}>
        <label className="admin-label">Current password</label>
        <input
          className="admin-input"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
        />

        <label className="admin-label">New password (at least 10 characters)</label>
        <input
          className="admin-input"
          type="password"
          autoComplete="new-password"
          minLength={10}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />

        <label className="admin-label">Type the new password again</label>
        <input
          className="admin-input"
          type="password"
          autoComplete="new-password"
          minLength={10}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />

        <div className="admin-actions">
          <button className="admin-btn admin-btn-primary" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Change password'}
          </button>
        </div>
      </form>
    </section>
  )
}
