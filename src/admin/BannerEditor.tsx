import { useEffect, useState } from 'react'
import { adminApi } from './adminApi'

interface Banner {
  active: boolean
  message: string
  type: 'holiday' | 'offer' | 'info'
}

export default function BannerEditor() {
  const [banner, setBanner] = useState<Banner>({ active: false, message: '', type: 'info' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi
      .get<{ banner: Banner }>('/api/admin/banner')
      .then((d) => setBanner(d.banner))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const save = async () => {
    setSaving(true)
    setNotice('')
    setError('')
    try {
      await adminApi.put('/api/admin/banner', { ...banner })
      setNotice('Saved. The banner is updated on the website right now.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="admin-muted">Loading…</p>

  return (
    <section className="admin-card">
      <h2>Announcement Banner</h2>
      <p className="admin-muted">
        This is the coloured strip at the very top of the website. Use it for things like holiday
        opening hours or a special announcement. Turn it off when you don&apos;t need it.
      </p>

      {notice && <div className="admin-alert admin-alert-ok">{notice}</div>}
      {error && <div className="admin-alert admin-alert-error">{error}</div>}

      <label className="admin-check">
        <input
          type="checkbox"
          checked={banner.active}
          onChange={(e) => setBanner({ ...banner, active: e.target.checked })}
        />
        Show the banner on the website
      </label>

      <label className="admin-label" htmlFor="banner-message">Banner message</label>
      <textarea
        id="banner-message"
        className="admin-input"
        rows={2}
        maxLength={300}
        value={banner.message}
        onChange={(e) => setBanner({ ...banner, message: e.target.value })}
        placeholder="e.g. We are open as normal over the Christmas holidays."
      />

      <label className="admin-label" htmlFor="banner-type">Banner colour</label>
      <select
        id="banner-type"
        className="admin-input"
        value={banner.type}
        onChange={(e) => setBanner({ ...banner, type: e.target.value as Banner['type'] })}
      >
        <option value="info">Blue — general information</option>
        <option value="holiday">Green — holiday notice</option>
        <option value="offer">Red — special offer</option>
      </select>

      <div className="admin-actions">
        <button className="admin-btn admin-btn-primary" onClick={save} disabled={saving}>
          {saving ? 'Saving…' : 'Save banner'}
        </button>
      </div>
    </section>
  )
}
