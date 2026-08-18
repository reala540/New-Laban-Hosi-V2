import { useEffect, useState } from 'react'
import { adminApi } from './adminApi'

interface Message {
  id: string
  name: string
  email: string | null
  phone: string | null
  message: string | null
  status: 'new' | 'read' | 'resolved'
  createdAt: string
}

const STATUS_LABELS: Record<Message['status'], string> = {
  new: 'New',
  read: 'Read',
  resolved: 'Resolved'
}

export default function MessagesView() {
  const [items, setItems] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () =>
    adminApi
      .get<{ messages: Message[] }>('/api/admin/messages')
      .then((d) => setItems(d.messages))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const setStatus = async (item: Message, status: Message['status']) => {
    try {
      await adminApi.patch('/api/admin/messages', { id: item.id, status })
      setItems(items.map((m) => (m.id === item.id ? { ...m, status } : m)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update')
    }
  }

  if (loading) return <p className="admin-muted">Loading…</p>

  return (
    <section className="admin-card">
      <h2>Contact Messages</h2>
      <p className="admin-muted">Messages sent through the website&apos;s contact form.</p>

      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      {items.length === 0 ? (
        <p className="admin-muted">No messages yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr><th>Received</th><th>From</th><th>Contact</th><th>Message</th><th>Status</th></tr>
          </thead>
          <tbody>
            {items.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.createdAt).toLocaleString()}</td>
                <td>{m.name}</td>
                <td>
                  {m.phone && <div><a href={`tel:${m.phone}`}>{m.phone}</a></div>}
                  {m.email && <div><a href={`mailto:${m.email}`}>{m.email}</a></div>}
                </td>
                <td className="admin-cell-wrap">{m.message}</td>
                <td>
                  <select
                    className="admin-input"
                    value={m.status}
                    onChange={(e) => setStatus(m, e.target.value as Message['status'])}
                  >
                    {(Object.keys(STATUS_LABELS) as Message['status'][]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
