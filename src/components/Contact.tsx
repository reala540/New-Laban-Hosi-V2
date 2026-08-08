import { useState } from 'react'
import { MapPin, Phone, Mail, AlertCircle, CheckCircle2 } from 'lucide-react'
import { submitMessage } from '../lib/api'

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  })
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await submitMessage({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        message: formData.message
      })

      setSuccess(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: ''
      })
    } catch (err) {
      setError('Failed to send message. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contact" className="contact-section">
      <div className="container">
        <h2 className="section-title reveal">Get in Touch</h2>
        <p className="section-subtitle">
          Have questions? We&apos;re here to help. Contact us today.
        </p>

        <div className="split-section split-section-contact">
          <div className="contact-info reveal">
            <div className="contact-card">
              <div className="contact-icon"><MapPin size={32} /></div>
              <div>
                <h3>Address</h3>
                <p>P.O. BOX 22263-00400</p>
                <p>Murang&apos;a &ndash; Kaharati</p>
                <p>Kenya</p>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon"><Phone size={32} /></div>
              <div>
                <h3>Phone</h3>
                <p>
                  <a href="tel:0717405323">0717 405 323</a>
                </p>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon"><Mail size={32} /></div>
              <div>
                <h3>Email</h3>
                <p>
                  <a href="mailto:thelabanhospital@outlook.com">
                    thelabanhospital@outlook.com
                  </a>
                </p>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-icon"><AlertCircle size={32} /></div>
              <div>
                <h3>Emergency</h3>
                <p className="contact-emergency-text">
                  Call 0717 405 323 Immediately
                </p>
                <p className="contact-emergency-note">Available 24/7</p>
              </div>
            </div>
          </div>

          <div className="form-container reveal">
            {success ? (
              <div className="success-card">
                <CheckCircle2 size={48} className="success-card-icon" />
                <h3>Thank you!</h3>
                <p>Your message has been sent. We&apos;ll get back to you soon.</p>
                <button className="submit-btn" onClick={() => setSuccess(false)}>
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                {error && (
                  <div className="form-error-message">
                    <AlertCircle size={20} />
                    <span>{error}</span>
                  </div>
                )}

                <h3>Send us a Message</h3>

                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      pattern="[0-9+\-\s()]{7,20}"
                      title="Enter a valid phone number (digits, spaces, +, - only)"
                    />
                  </div>

                  <div className="form-group">
                    <label>Message *</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Your message..."
                      required
                    />
                  </div>

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/*
          Precise pin on The Laban Hospital's actual location
          (-0.8392255, 37.1377577), taken from the hospital's Google Maps listing.
        */}
        <div className="map-embed reveal">
          <iframe
            src="https://www.google.com/maps?q=-0.8392255,37.1377577(The+Laban+Hospital)&z=17&output=embed"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="The Laban Hospital location map"
          />
          <a
            className="map-directions-link"
            href="https://www.google.com/maps/place/The+Laban+Hospital/@-0.8398412,37.136759,18.25z/data=!4m6!3m5!1s0x1828a500452151db:0x58bcb277c3641524!8m2!3d-0.8392255!4d37.1377577!16s%2Fg%2F11xgjyvl55?hl=en-US"
            target="_blank"
            rel="noopener noreferrer"
          >
            Get Directions →
          </a>
        </div>
      </div>
    </section>
  )
}
