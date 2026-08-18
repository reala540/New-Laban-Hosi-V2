import { useEffect, useRef, useState } from 'react'
import { adminApi, uploadImage } from './adminApi'

interface GalleryItem {
  id: string
  url: string
  caption: string
  createdAt: string
}

export default function GalleryEditor() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [caption, setCaption] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const [pendingUrl, setPendingUrl] = useState('')

  const load = () =>
    adminApi
      .get<{ gallery: GalleryItem[] }>('/api/admin/gallery')
      .then((d) => setItems(d.gallery))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))

  useEffect(() => {
    load()
  }, [])

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const { url } = await uploadImage(file)
      setPendingUrl(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const addPhoto = async () => {
    if (!pendingUrl) return
    setError('')
    try {
      await adminApi.post('/api/admin/gallery', { url: pendingUrl, caption })
      setNotice('Photo added to the gallery.')
      setPendingUrl('')
      setCaption('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    }
  }

  const saveCaption = async (item: GalleryItem, newCaption: string) => {
    try {
      await adminApi.put('/api/admin/gallery', { id: item.id, caption: newCaption })
      setNotice('Caption saved.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save caption')
    }
  }

  const remove = async (item: GalleryItem) => {
    if (!window.confirm('Delete this photo from the gallery? This cannot be undone.')) return
    try {
      await adminApi.del('/api/admin/gallery', { id: item.id })
      setNotice('Photo deleted.')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not delete')
    }
  }

  if (loading) return <p className="admin-muted">Loading…</p>

  return (
    <section className="admin-card">
      <h2>Gallery Photos</h2>
      <p className="admin-muted">
        Add photos of the hospital, the team, or community events. They appear on the website&apos;s
        gallery.
      </p>

      {notice && <div className="admin-alert admin-alert-ok">{notice}</div>}
      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      <div className="admin-form admin-gallery-add">
        <div className="admin-image-upload-row">
          {pendingUrl ? (
            <img className="admin-image-preview" src={pendingUrl} alt="New upload" />
          ) : (
            <div className="admin-image-preview admin-image-empty">No photo chosen</div>
          )}
          <div>
            <button
              type="button"
              className="admin-btn"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading…' : '1. Choose photo'}
            </button>
            <p className="admin-hint">JPG, PNG or WebP, up to 2 MB.</p>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pickFile} />

        <label className="admin-label">Caption (optional)</label>
        <input
          className="admin-input"
          value={caption}
          maxLength={200}
          placeholder="e.g. Our maternity ward"
          onChange={(e) => setCaption(e.target.value)}
        />
        <div className="admin-actions">
          <button className="admin-btn admin-btn-primary" onClick={addPhoto} disabled={!pendingUrl}>
            2. Add to gallery
          </button>
        </div>
      </div>

      <div className="admin-gallery-grid">
        {items.map((item) => (
          <figure className="admin-gallery-item" key={item.id}>
            <img src={item.url} alt={item.caption} loading="lazy" />
            <CaptionInput
              caption={item.caption}
              onSave={(c) => saveCaption(item, c)}
            />
            <button className="admin-btn admin-btn-danger" onClick={() => remove(item)}>Delete</button>
          </figure>
        ))}
        {items.length === 0 && <p className="admin-muted">No gallery photos yet.</p>}
      </div>
    </section>
  )
}

function CaptionInput({ caption, onSave }: { caption: string; onSave: (c: string) => void }) {
  const [value, setValue] = useState(caption)
  return (
    <div className="admin-caption-row">
      <input
        className="admin-input"
        value={value}
        maxLength={200}
        onChange={(e) => setValue(e.target.value)}
      />
      <button className="admin-btn" onClick={() => onSave(value)} disabled={value === caption}>
        Save
      </button>
    </div>
  )
}
