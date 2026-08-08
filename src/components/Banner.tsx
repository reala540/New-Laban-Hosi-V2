import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useContent } from '../lib/ContentContext'

const STORAGE_KEY = 'laban-banner-dismissed'

export default function Banner() {
  const { content } = useContent()
  const [dismissed, setDismissed] = useState(false)

  // Re-check dismissal whenever the banner message changes, keyed to the
  // message itself - so if the hospital publishes a new announcement, it
  // shows even if the previous one was dismissed this session.
  useEffect(() => {
    if (!content.banner?.message) return
    const stored = sessionStorage.getItem(STORAGE_KEY)
    setDismissed(stored === content.banner.message)
  }, [content.banner?.message])

  const handleDismiss = () => {
    setDismissed(true)
    if (content.banner?.message) {
      sessionStorage.setItem(STORAGE_KEY, content.banner.message)
    }
  }

  if (!content.banner?.active || !content.banner.message || dismissed) {
    return null
  }

  return (
    <div className={`announcement-banner banner-${content.banner.type}`}>
      <div className="container banner-content">
        <span>{content.banner.message}</span>
        <button
          className="banner-close"
          onClick={handleDismiss}
          aria-label="Dismiss announcement"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
