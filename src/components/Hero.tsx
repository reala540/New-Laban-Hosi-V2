import { useEffect, useRef } from 'react'
import { Clock, Award, Building2, HeartHandshake, ArrowRight, ChevronDown } from 'lucide-react'

const badges = [
  { icon: Clock, label: 'Open 24/7' },
  { icon: Award, label: 'Qualified Specialists' },
  { icon: Building2, label: 'Modern Facilities' },
  { icon: HeartHandshake, label: 'Compassionate Care' }
]

export default function Hero() {
  const visualRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    const onScroll = () => {
      const el = visualRef.current
      if (!el) return
      // Cards drift ~12% slower than the page - a subtle parallax that
      // stops once the hero has scrolled out of view.
      const offset = Math.min(window.scrollY, 600) * 0.12
      el.style.setProperty('--parallax-offset', `${offset}px`)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const scrollToContact = () => {
    const element = document.getElementById('contact')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const scrollToBook = () => {
    const element = document.getElementById('appointment')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <section id="home" className="hero">
      <div className="hero-gradient-overlay" aria-hidden="true" />
      <div className="container hero-grid">
        <div className="hero-content">
          <span className="hero-eyebrow">The Laban Hospital</span>
          <h2 className="hero-title">Welcome to The Laban Hospital</h2>
          <p className="hero-subtitle">
            Compassionate Care. Advanced Medicine. Trusted Professionals.
          </p>
          <div className="hero-ctas">
            <button className="cta-button cta-button-arrow" onClick={scrollToBook}>
              Book Appointment
              <ArrowRight size={18} className="cta-arrow" />
            </button>
            <button className="cta-button outline" onClick={scrollToContact}>
              Contact Us
            </button>
          </div>
          <div className="hero-badges">
            {badges.map((b) => (
              <div className={`hero-badge ${b.label === 'Open 24/7' ? 'hero-badge-pulse' : ''}`} key={b.label}>
                <b.icon size={18} />
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hero-visual" aria-hidden="true" ref={visualRef}>
          <div className="hero-visual-card hero-visual-card-1">
            <Building2 size={22} />
            <div>
              <strong>24/7</strong>
              <span>Emergency Care</span>
            </div>
          </div>
          <div className="hero-visual-card hero-visual-card-2">
            <HeartHandshake size={22} />
            <div>
              <strong>Patient-first</strong>
              <span>Every visit, every time</span>
            </div>
          </div>
        </div>
      </div>
      <button
        className="hero-scroll-indicator"
        aria-label="Scroll to next section"
        onClick={() => window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' })}
      >
        <ChevronDown size={28} />
      </button>
    </section>
  )
}
