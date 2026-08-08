import { useEffect, useRef, useState } from 'react'

// Real, curated photos of the hospital, its grounds, staff, and community
// outreach work. These ship as static assets bundled with the site rather
// than being pulled from the gallery_items table: the admin panel that used
// to write to that table has been removed (see project handoff notes), so
// there is no longer a live path for new photos to reach the database.
// Captions describe only what is actually visible in each photo.
const PHOTOS = [
  {
    src: '/gallery/hospital-front-view.jpg',
    caption: 'The Laban Hospital, viewed from the front approach'
  },
  {
    src: '/gallery/hospital-from-railway.jpg',
    caption: 'Visible from the roadside near the railway crossing, open 24 hours a day'
  },
  {
    src: '/gallery/staff-team-outside.jpg',
    caption: 'Members of our staff team outside the main entrance'
  },
  {
    src: '/gallery/maternal-health-talk.jpg',
    caption: 'A health educator speaking with mothers and their children in the waiting area'
  },
  {
    src: '/gallery/newborn-warmer-care.jpg',
    caption: 'A newborn receiving care under the radiant warmer in our maternity unit'
  },
  {
    src: '/gallery/mother-carrying-newborn.jpg',
    caption: 'A new mother carrying her baby through the hospital corridor'
  },
  {
    src: '/gallery/corridor-child-health-day.jpg',
    caption: 'Staff greeting mothers and children during a child health day'
  },
  {
    src: '/gallery/waiting-area-gathering.jpg',
    caption: 'Visitors gathered together in our bright reception area'
  },
  {
    src: '/gallery/community-outreach-seating.jpg',
    caption: 'A community outreach gathering held under the covered walkway'
  },
  {
    src: '/gallery/outreach-gift-bags.jpg',
    caption: 'Community members leaving with supplies after an outreach event'
  },
  {
    src: '/gallery/elderly-community-day.jpg',
    caption: 'Elderly community members attending a health outreach day'
  },
  {
    src: '/gallery/reception-window.jpg',
    caption: 'A patient at our reception window'
  },
  {
    src: '/gallery/staff-meeting-table.jpg',
    caption: 'Staff meeting together over tea to plan the week ahead'
  }
]

export default function PhotoShowcase() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [paused, setPaused] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)
  const resumeTimer = useRef<number | null>(null)
  const dragState = useRef<{ down: boolean; startX: number; scrollLeft: number }>({
    down: false,
    startX: 0,
    scrollLeft: 0
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Auto-scroll loop: a slow constant drift, ~35px/second, paused on
  // hover/drag. Uses scrollLeft directly (not transform) so native touch
  // scrolling and drag both compose with it for free.
  useEffect(() => {
    if (reducedMotion) return
    const track = trackRef.current
    if (!track) return
    let raf = 0
    let last = performance.now()
    const speed = 35 // px per second

    const step = (now: number) => {
      const dt = (now - last) / 1000
      last = now
      if (!paused && !dragState.current.down) {
        track.scrollLeft += speed * dt
        // Seamless loop: once we've scrolled past one full copy of the
        // photo set, snap back by that width with no visible jump since
        // the content is duplicated.
        const singleSetWidth = track.scrollWidth / 2
        if (track.scrollLeft >= singleSetWidth) {
          track.scrollLeft -= singleSetWidth
        }
      }
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [paused, reducedMotion])

  const onPointerDown = (e: React.PointerEvent) => {
    const track = trackRef.current
    if (!track) return
    dragState.current = { down: true, startX: e.clientX, scrollLeft: track.scrollLeft }
    track.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const track = trackRef.current
    if (!track || !dragState.current.down) return
    const dx = e.clientX - dragState.current.startX
    track.scrollLeft = dragState.current.scrollLeft - dx
  }

  const endDrag = () => {
    dragState.current.down = false
    if (resumeTimer.current) window.clearTimeout(resumeTimer.current)
    // Resume auto-scroll 3s after the user stops interacting.
    resumeTimer.current = window.setTimeout(() => setPaused(false), 3000)
  }

  if (PHOTOS.length === 0) return null

  // Respect prefers-reduced-motion fully: show a static grid instead of an
  // auto-scrolling track, rather than just turning off the animation on
  // the same layout (a still marquee track is an awkward, half-cut-off grid).
  if (reducedMotion) {
    return (
      <section className="showcase" aria-label="Photo showcase">
        <div className="showcase-heading reveal">
          <span className="eyebrow">Around The Laban Hospital</span>
          <h2>A closer look at our facility and community</h2>
        </div>
        <div className="container">
          <div className="showcase-static-grid">
            {PHOTOS.map((photo) => (
              <figure className="showcase-card showcase-card-static" key={photo.src}>
                <img src={photo.src} alt={photo.caption} loading="lazy" />
                <figcaption>{photo.caption}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Duplicate the photo set once so the loop can wrap seamlessly.
  const loopPhotos = [...PHOTOS, ...PHOTOS]

  return (
    <section className="showcase" aria-label="Photo showcase">
      <div className="showcase-heading reveal">
        <span className="eyebrow">Around The Laban Hospital</span>
        <h2>A closer look at our facility and community</h2>
      </div>
      <div
        className="showcase-track"
        ref={trackRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
      >
        {loopPhotos.map((photo, i) => (
          <figure className="showcase-card" key={`${photo.src}-${i}`}>
            <img src={photo.src} alt={photo.caption} loading="lazy" draggable={false} />
            <figcaption>{photo.caption}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
