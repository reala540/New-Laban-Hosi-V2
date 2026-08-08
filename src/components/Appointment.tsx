import { useState } from 'react'
import { CheckCircle2, AlertCircle, Phone, Mail, Clock, Loader2 } from 'lucide-react'
import { submitAppointment } from '../lib/api'

export default function Appointment() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    department: '',
    preferredDate: '',
    message: ''
  })
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      await submitAppointment({
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        department: formData.department,
        preferredDate: formData.preferredDate,
        message: formData.message
      })

      setSuccess(true)
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        department: '',
        preferredDate: '',
        message: ''
      })
    } catch (err) {
      setError('Failed to book appointment. Please try again.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="appointment" className="appointment-section">
      <div className="container">
        <div className="split-section">
          <div className="split-info reveal">
            <h2 className="section-title split-info-title">Book an Appointment</h2>
            <p className="section-subtitle split-info-subtitle">
              Schedule your medical appointment with our experienced doctors
            </p>
            <div className="split-info-list">
              <div className="split-info-item">
                <Phone size={20} />
                <div>
                  <strong>Call us</strong>
                  <a href="tel:0717405323">0717 405 323</a>
                </div>
              </div>
              <div className="split-info-item">
                <Mail size={20} />
                <div>
                  <strong>Email us</strong>
                  <a href="mailto:thelabanhospital@outlook.com">thelabanhospital@outlook.com</a>
                </div>
              </div>
              <div className="split-info-item">
                <Clock size={20} />
                <div>
                  <strong>Hours</strong>
                  <span>Open 24 hours, every day</span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-container reveal">
            {success ? (
              <div className="success-card">
                <CheckCircle2 size={48} className="success-card-icon" />
                <h3>Thank you!</h3>
                <p>We&apos;ll contact you shortly to confirm your appointment.</p>
                <button className="submit-btn" onClick={() => setSuccess(false)}>
                  Book Another Appointment
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

                <form onSubmit={handleSubmit}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        pattern="[0-9+\-\s()]{7,20}"
                        title="Enter a valid phone number (digits, spaces, +, - only)"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Department *</label>
                      <select
                        name="department"
                        value={formData.department}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select a department</option>
                        <option value="Emergency">Accident & Emergency</option>
                        <option value="Outpatient">Outpatient Services</option>
                        <option value="Maternity">Maternity Services</option>
                        <option value="Laboratory">Laboratory Services</option>
                        <option value="Surgery">Surgery</option>
                        <option value="Radiology">Radiology</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Preferred Date *</label>
                    <input
                      type="date"
                      name="preferredDate"
                      value={formData.preferredDate}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Additional Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us about your symptoms or concerns..."
                    />
                  </div>

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 size={18} className="submit-spinner" />
                        Submitting...
                      </>
                    ) : (
                      'Book Appointment'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
