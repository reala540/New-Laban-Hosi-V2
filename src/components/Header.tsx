import { useState, useEffect } from 'react'
import { Menu, X, Phone, Mail, MapPin, Clock, AlertCircle } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'doctors', label: 'Doctors' },
  { id: 'contact', label: 'Contact' }
]

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30)
      const doc = document.documentElement
      const scrollable = doc.scrollHeight - doc.clientHeight
      setProgress(scrollable > 0 ? Math.min(1, window.scrollY / scrollable) : 0)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll while the full-screen mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = isMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMenuOpen])

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setIsMenuOpen(false)
    }
  }

  // Escape key closes the mobile menu, per spec.
  useEffect(() => {
    if (!isMenuOpen) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isMenuOpen])

  return (
    <>
      <div className="scroll-progress" style={{ transform: `scaleX(${progress})` }} />

      <div className="header-top">
        <div className="container header-top-inner">
          <div className="header-top-content">
            <div className="header-top-item">
              <Phone size={14} />
              <a href="tel:0717405323">0717 405 323</a>
            </div>
            <div className="header-top-item">
              <Mail size={14} />
              <a href="mailto:thelabanhospital@outlook.com">thelabanhospital@outlook.com</a>
            </div>
            <div className="header-top-item header-top-item-hide-sm">
              <MapPin size={14} />
              <span>Murang&apos;a &ndash; Kaharati</span>
            </div>
            <div className="header-top-item header-top-item-hide-sm">
              <Clock size={14} />
              <span>Open 24 Hours</span>
            </div>
          </div>
          <div className="emergency-badge">
            <AlertCircle size={14} />
            Emergency: 0717 405 323
          </div>
        </div>
      </div>

      <header className={`header ${scrolled ? 'header-scrolled' : ''}`}>
        <div className="container">
          <div className="header-content">
            <div className="logo-section">
              <img src="/20260223_124122.jpg" alt="The Laban Hospital Logo" className="logo" />
              <div className="hospital-name">
                <h1>The Laban Hospital</h1>
                <p className="tagline">Compassionate Care. Advanced Medicine.</p>
              </div>
            </div>

            <button
              className="menu-toggle"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
            </button>

            <nav className="nav nav-desktop">
              {NAV_ITEMS.map((item) => (
                <a key={item.id} onClick={() => scrollToSection(item.id)}>
                  {item.label}
                </a>
              ))}
              <button className="nav-cta-btn" onClick={() => scrollToSection('appointment')}>
                Book Appointment
              </button>
            </nav>
          </div>
        </div>
      </header>

      <div className={`mobile-menu-backdrop ${isMenuOpen ? 'is-open' : ''}`} onClick={() => setIsMenuOpen(false)} />
      <nav className={`mobile-menu-overlay ${isMenuOpen ? 'is-open' : ''}`} aria-hidden={!isMenuOpen}>
        {NAV_ITEMS.map((item, i) => (
          <a
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            style={{ transitionDelay: isMenuOpen ? `${i * 50}ms` : '0ms' }}
          >
            {item.label}
          </a>
        ))}
        <button
          className="nav-cta-btn mobile-menu-cta"
          onClick={() => scrollToSection('appointment')}
          style={{ transitionDelay: isMenuOpen ? `${NAV_ITEMS.length * 50}ms` : '0ms' }}
        >
          Book Appointment
        </button>
      </nav>
    </>
  )
}
