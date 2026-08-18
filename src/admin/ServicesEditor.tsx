import { useEffect, useState } from 'react'
import { adminApi } from './adminApi'

interface ServiceItem {
  id: string
  name: string
  description: string
  icon: string
  sortOrder: number
}

const ICON_OPTIONS = [
  { value: 'ambulance', label: 'Ambulance / Emergency' },
  { value: 'clipboard', label: 'Clipboard / Outpatient' },
  { value: 'bed', label: 'Bed / Inpatient' },
  { value: 'baby', label: 'Baby / Maternity' },
  { value: 'flask', label: 'Flask / Laboratory' },
  { value: 'pill', label: 'Pill / Pharmacy' },
  { value: 'scan', label: 'Scan / Radiology' },
  { value: 'scissors', label: 'Scissors / Surgery' },
  { value: 'stethoscope', label: 'Stethoscope / General' },
  { value: 'heart', label: 'Heart / Cardiology' },
  { value: 'activity', label: 'Activity / Vitals' },
  { value: 'microscope', label: 'Microscope / Pathology' }
]

const EMPTY: Omit<ServiceItem, 'id'> = { name: '', description: '', icon: 'stethoscope', sortOrder: 0 }

export default function ServicesEditor() {
  const [items, setItems] = useState<ServiceItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<ServiceItem | 'new' | null>(null)
  const [form, setForm] = useState<Omit<ServiceItem, 'id'>>(EMPTY)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = () =>
    adminApi
      .get<{ services: ServiceItem[] }>('/api/admin/services')
      .then((d) => setItems(d.services))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const startNew = () => {
    setForm(EMPTY)
    setEditing('new')
    setError('')
    setNotice('')
  }

  const startEdit = (item: ServiceItem) => {
    setForm({ name: item.name, description: item.description, icon: item.icon, sortOrder: item.sortOrder })
    setEditing(item)
    setError('')
    setNotice('')
  }

  const save = async () => {
    setError('')
    try {
      if (editing === 'new') {
        await adminApi.post('/api/admin/services', { ...form })
        setNotice('Service added.')
      } else if (editing) {
        await adminApi.put('/api/admin/services', { id: editing.id, ...form })
        setNotice('Service updated.')
      }
      setEditing(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    }
  }

  const remove = async (item: ServiceItem) => {
    if (!window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return
    try {
      await adminApi.del('/api/admin/services', { id: item.id })
      setNotice('Service deleted.')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete')
    }
  }

  if (loading) return <p className="admin-muted">Loading…</p>

  return (
    <section className="admin-card">
      <h2>Services</h2>
      <p className="admin-muted">
        These appear in the &quot;Our Services&quot; section of the website. Smaller &quot;order&quot;
        numbers appear first.
      </p>

      {notice && <div className="admin-alert admin-alert-ok">{notice}</div>}
      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      {editing === null ? (
        <>
          <table className="admin-table">
            <thead>
              <tr><th>Name</th><th>Description</th><th>Order</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>{s.description}</td>
                  <td>{s.sortOrder}</td>
                  <td className="admin-row-actions">
                    <button className="admin-btn" onClick={() => startEdit(s)}>Edit</button>
                    <button className="admin-btn admin-btn-danger" onClick={() => remove(s)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="admin-actions">
            <button className="admin-btn admin-btn-primary" onClick={startNew}>Add a service</button>
          </div>
        </>
      ) : (
        <div className="admin-form">
          <label className="admin-label">Service name *</label>
          <input
            className="admin-input"
            value={form.name}
            maxLength={120}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <label className="admin-label">Short description *</label>
          <textarea
            className="admin-input"
            rows={3}
            maxLength={500}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <label className="admin-label">Icon</label>
          <select
            className="admin-input"
            value={form.icon}
            onChange={(e) => setForm({ ...form, icon: e.target.value })}
          >
            {ICON_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>

          <label className="admin-label">Order (0 = first)</label>
          <input
            className="admin-input"
            type="number"
            min={0}
            max={9999}
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
          />

          <div className="admin-actions">
            <button className="admin-btn admin-btn-primary" onClick={save} disabled={!form.name || !form.description}>
              Save
            </button>
            <button className="admin-btn admin-btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  )
}
