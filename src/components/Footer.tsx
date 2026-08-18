import { useEffect, useState } from 'react'
import { Facebook, Instagram, Twitter, ArrowUp } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const onScroll = () => setShowBackToTop(window.scrollY > 400)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>The Laban Hospital</h3>
            <p>Compassionate Care. Advanced Medicine. Trusted Professionals.</p>
            <p className="footer-address">
              P.O. BOX 22263-00400<br />
              Murang'a – Kaharati, Kenya
            </p>
            {/* Social profile links - point these at the hospital's real pages once they exist */}
            <div className="footer-social">
              <a href="#" aria-label="Facebook"><Facebook size={16} /></a>
              <a href="#" aria-label="Instagram"><Instagram size={16} /></a>
              <a href="#" aria-label="Twitter / X"><Twitter size={16} /></a>
            </div>
          </div>

          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#home">Home</a></li>
              <li><a href="#about">About</a></li>
              <li><a href="#why-us">Why Choose Us</a></li>
              <li><a href="#services">Services</a></li>
              <li><a href="#doctors">Doctors</a></li>
              <li><a href="#contact">Contact</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Departments</h3>
            <ul>
              <li><a href="#services">Accident &amp; Emergency</a></li>
              <li><a href="#services">Outpatient Services</a></li>
              <li><a href="#services">Inpatient Admission</a></li>
              <li><a href="#services">Maternity Services</a></li>
              <li><a href="#services">Laboratory Services</a></li>
              <li><a href="#services">Pharmacy</a></li>
              <li><a href="#services">Radiology</a></li>
              <li><a href="#services">Surgery</a></li>
            </ul>
          </div>

          <div className="footer-section">
            <h3>Contact &amp; Hours</h3>
            <p>
              <strong>Phone:</strong> <a href="tel:0717405323">0717 405 323</a>
            </p>
            <p>
              <strong>Email:</strong> <a href="mailto:thelabanhospital@outlook.com">thelabanhospital@outlook.com</a>
            </p>
            <p>
              <strong>Hours:</strong> Open 24 Hours
            </p>
            <p className="footer-emergency-line">
              <strong>Emergency:</strong> 0717 405 323 (24/7)
            </p>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {currentYear} The Laban Hospital. All rights reserved.</p>
          <div className="footer-legal-links">
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/terms-of-service">Terms of Service</a>
          </div>
        </div>
      </div>

      <button
        className={`back-to-top ${showBackToTop ? 'is-visible' : ''}`}
        aria-label="Back to top"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        <ArrowUp size={20} />
      </button>
    </footer>
  )
}
