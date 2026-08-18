import { useEffect, useState } from 'react'
import { adminApi } from './adminApi'
import ImageUpload from './ImageUpload'

interface Doctor {
  id: string
  name: string
  specialty: string
  bio: string
  imageUrl: string | null
  sortOrder: number
}

const EMPTY = { name: '', specialty: '', bio: '', imageUrl: '', sortOrder: 0 }

export default function DoctorsEditor() {
  const [items, setItems] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Doctor | 'new' | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = () =>
    adminApi
      .get<{ doctors: Doctor[] }>('/api/admin/doctors')
      .then((d) => setItems(d.doctors))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const startEdit = (d: Doctor) => {
    setForm({ name: d.name, specialty: d.specialty, bio: d.bio, imageUrl: d.imageUrl ?? '', sortOrder: d.sortOrder })
    setEditing(d)
    setError('')
    setNotice('')
  }

  const save = async () => {
    setError('')
    try {
      if (editing === 'new') {
        await adminApi.post('/api/admin/doctors', { ...form })
        setNotice('Doctor added.')
      } else if (editing) {
        await adminApi.put('/api/admin/doctors', { id: editing.id, ...form })
        setNotice('Doctor updated.')
      }
      setEditing(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    }
  }

  const remove = async (d: Doctor) => {
    if (!window.confirm(`Remove "${d.name}" from the website? This cannot be undone.`)) return
    try {
      await adminApi.del('/api/admin/doctors', { id: d.id })
      setNotice('Doctor removed.')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete')
    }
  }

  if (loading) return <p className="admin-muted">Loading…</p>

  return (
    <section className="admin-card">
      <h2>Doctors</h2>
      <p className="admin-muted">
        These appear in the &quot;Our Medical Team&quot; section. Smaller &quot;order&quot; numbers
        appear first.
      </p>

      {notice && <div className="admin-alert admin-alert-ok">{notice}</div>}
      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      {editing === null ? (
        <>
          <table className="admin-table">
            <thead>
              <tr><th>Photo</th><th>Name</th><th>Specialty</th><th>Order</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((d) => (
                <tr key={d.id}>
                  <td>{d.imageUrl ? <img className="admin-thumb" src={d.imageUrl} alt="" /> : '—'}</td>
                  <td>{d.name}</td>
                  <td>{d.specialty}</td>
                  <td>{d.sortOrder}</td>
                  <td className="admin-row-actions">
                    <button className="admin-btn" onClick={() => startEdit(d)}>Edit</button>
                    <button className="admin-btn admin-btn-danger" onClick={() => remove(d)}>Delete</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} className="admin-muted">No doctors yet. Add your first one below.</td></tr>
              )}
            </tbody>
          </table>
          <div className="admin-actions">
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => {
                setForm(EMPTY)
                setEditing('new')
                setError('')
                setNotice('')
              }}
            >
              Add a doctor
            </button>
          </div>
        </>
      ) : (
        <div className="admin-form">
          <label className="admin-label">Full name *</label>
          <input
            className="admin-input"
            value={form.name}
            maxLength={120}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <label className="admin-label">Specialty / role *</label>
          <input
            className="admin-input"
            value={form.specialty}
            maxLength={120}
            placeholder="e.g. General Practitioner"
            onChange={(e) => setForm({ ...form, specialty: e.target.value })}
          />

          <label className="admin-label">Short bio</label>
          <textarea
            className="admin-input"
            rows={3}
            maxLength={1000}
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
          />

          <ImageUpload value={form.imageUrl} onChange={(url) => setForm({ ...form, imageUrl: url })} />

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
            <button
              className="admin-btn admin-btn-primary"
              onClick={save}
              disabled={!form.name || !form.specialty}
            >
              Save
            </button>
            <button className="admin-btn admin-btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
          </div>
        </div>
      )}
    </section>
  )
}
