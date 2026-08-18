import { useEffect, useState } from 'react'
import { adminApi } from './adminApi'

interface Appointment {
  id: string
  fullName: string
  email: string | null
  phone: string | null
  department: string | null
  preferredDate: string | null
  message: string | null
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  createdAt: string
}

const STATUS_LABELS: Record<Appointment['status'], string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  completed: 'Completed',
  cancelled: 'Cancelled'
}

export default function AppointmentsView() {
  const [items, setItems] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = () =>
    adminApi
      .get<{ appointments: Appointment[] }>('/api/admin/appointments')
      .then((d) => setItems(d.appointments))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const setStatus = async (item: Appointment, status: Appointment['status']) => {
    try {
      await adminApi.patch('/api/admin/appointments', { id: item.id, status })
      setItems(items.map((a) => (a.id === item.id ? { ...a, status } : a)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update')
    }
  }

  if (loading) return <p className="admin-muted">Loading…</p>

  return (
    <section className="admin-card">
      <h2>Appointment Requests</h2>
      <p className="admin-muted">
        These are sent in from the website&apos;s &quot;Book Appointment&quot; form. Call or email the
        patient to confirm, then mark the request here so you know it&apos;s handled.
      </p>

      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      {items.length === 0 ? (
        <p className="admin-muted">No appointment requests yet.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Received</th><th>Patient</th><th>Contact</th><th>Department</th><th>Preferred date</th><th>Message</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {items.map((a) => (
              <tr key={a.id}>
                <td>{new Date(a.createdAt).toLocaleString()}</td>
                <td>{a.fullName}</td>
                <td>
                  {a.phone && <div><a href={`tel:${a.phone}`}>{a.phone}</a></div>}
                  {a.email && <div><a href={`mailto:${a.email}`}>{a.email}</a></div>}
                </td>
                <td>{a.department || '—'}</td>
                <td>{a.preferredDate || '—'}</td>
                <td className="admin-cell-wrap">{a.message || '—'}</td>
                <td>
                  <select
                    className="admin-input"
                    value={a.status}
                    onChange={(e) => setStatus(a, e.target.value as Appointment['status'])}
                  >
                    {(Object.keys(STATUS_LABELS) as Appointment['status'][]).map((s) => (
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
