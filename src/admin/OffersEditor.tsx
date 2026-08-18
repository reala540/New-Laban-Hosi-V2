import { useEffect, useState } from 'react'
import { adminApi } from './adminApi'
import ImageUpload from './ImageUpload'

interface Offer {
  id: string
  title: string
  description: string
  imageUrl: string | null
  active: boolean
  sortOrder: number
}

const EMPTY = { title: '', description: '', imageUrl: '', active: true, sortOrder: 0 }

export default function OffersEditor() {
  const [items, setItems] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Offer | 'new' | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const load = () =>
    adminApi
      .get<{ offers: Offer[] }>('/api/admin/offers')
      .then((d) => setItems(d.offers))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const startEdit = (o: Offer) => {
    setForm({
      title: o.title,
      description: o.description,
      imageUrl: o.imageUrl ?? '',
      active: o.active,
      sortOrder: o.sortOrder
    })
    setEditing(o)
    setError('')
    setNotice('')
  }

  const save = async () => {
    setError('')
    try {
      if (editing === 'new') {
        await adminApi.post('/api/admin/offers', { ...form })
        setNotice('Offer added.')
      } else if (editing) {
        await adminApi.put('/api/admin/offers', { id: editing.id, ...form })
        setNotice('Offer updated.')
      }
      setEditing(null)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    }
  }

  const remove = async (o: Offer) => {
    if (!window.confirm(`Delete the offer "${o.title}"? This cannot be undone.`)) return
    try {
      await adminApi.del('/api/admin/offers', { id: o.id })
      setNotice('Offer deleted.')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete')
    }
  }

  if (loading) return <p className="admin-muted">Loading…</p>

  return (
    <section className="admin-card">
      <h2>Offers</h2>
      <p className="admin-muted">
        These appear in the &quot;Current Offers&quot; section. Untick &quot;show on website&quot;
        to hide an offer without deleting it.
      </p>

      {notice && <div className="admin-alert admin-alert-ok">{notice}</div>}
      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      {editing === null ? (
        <>
          <table className="admin-table">
            <thead>
              <tr><th>Title</th><th>Shown?</th><th>Order</th><th></th></tr>
            </thead>
            <tbody>
              {items.map((o) => (
                <tr key={o.id}>
                  <td>{o.title}</td>
                  <td>{o.active ? 'Yes' : 'No'}</td>
                  <td>{o.sortOrder}</td>
                  <td className="admin-row-actions">
                    <button className="admin-btn" onClick={() => startEdit(o)}>Edit</button>
                    <button className="admin-btn admin-btn-danger" onClick={() => remove(o)}>Delete</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={4} className="admin-muted">No offers yet. Add your first one below.</td></tr>
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
              Add an offer
            </button>
          </div>
        </>
      ) : (
        <div className="admin-form">
          <label className="admin-label">Offer title *</label>
          <input
            className="admin-input"
            value={form.title}
            maxLength={150}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <label className="admin-label">Description *</label>
          <textarea
            className="admin-input"
            rows={3}
            maxLength={600}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <ImageUpload
            label="Photo (optional)"
            value={form.imageUrl}
            onChange={(url) => setForm({ ...form, imageUrl: url })}
          />

          <label className="admin-check">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Show this offer on the website
          </label>

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
              disabled={!form.title || !form.description}
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
