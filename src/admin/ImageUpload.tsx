import { useRef, useState } from 'react'
import { uploadImage } from './adminApi'

/**
 * Shared image picker used by the Doctors, Offers and Gallery editors.
 * Shows the current image, lets the owner pick a new one, uploads it and
 * reports the resulting /api/media URL back via onChange.
 */
export default function ImageUpload({
  value,
  onChange,
  label = 'Photo'
}: {
  value: string
  onChange: (url: string) => void
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setBusy(true)
    setError('')
    try {
      const { url } = await uploadImage(file)
      onChange(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-image-upload">
      <span className="admin-label">{label}</span>
      <div className="admin-image-upload-row">
        {value ? (
          <img className="admin-image-preview" src={value} alt="Current" />
        ) : (
          <div className="admin-image-preview admin-image-empty">No photo</div>
        )}
        <div>
          <button
            type="button"
            className="admin-btn"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            {busy ? 'Uploading…' : value ? 'Change photo' : 'Choose photo'}
          </button>
          {value && (
            <button
              type="button"
              className="admin-btn admin-btn-ghost"
              onClick={() => onChange('')}
              disabled={busy}
            >
              Remove
            </button>
          )}
          <p className="admin-hint">JPG, PNG or WebP, up to 2 MB.</p>
          {error && <p className="admin-alert admin-alert-error">{error}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        hidden
        onChange={pick}
      />
    </div>
  )
}
