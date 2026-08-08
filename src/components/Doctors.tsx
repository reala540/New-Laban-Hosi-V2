import { useContent } from '../lib/ContentContext'

export default function Doctors() {
  const { content, loading } = useContent()
  const doctors = content.doctors

  const scrollToBook = () => {
    document.getElementById('appointment')?.scrollIntoView({ behavior: 'smooth' })
  }

  if (loading) {
    return (
      <section id="doctors" className="doctors">
        <div className="container">
          <h2 className="section-title">Our Medical Team</h2>
          <p className="section-subtitle">Meet our experienced and dedicated healthcare professionals</p>
          <div className="doctors-grid" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div className="skeleton skeleton-card" key={i} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Per spec: hide this section completely if there are no doctors yet.
  if (doctors.length === 0) return null

  return (
    <section id="doctors" className="doctors">
      <div className="container">
        <h2 className="section-title">Our Medical Team</h2>
        <p className="section-subtitle">
          Meet our experienced and dedicated healthcare professionals
        </p>
        <div className="doctors-grid">
          {doctors.map((doctor, i) => (
            <div
              key={doctor.id}
              className="doctor-card reveal"
              style={{ transitionDelay: `${Math.min(i, 8) * 100}ms` }}
            >
              {doctor.imageUrl && (
                <div className="doctor-image-wrap">
                  <img src={doctor.imageUrl} alt={doctor.name} className="doctor-image" loading="lazy" />
                </div>
              )}
              <h3>{doctor.name}</h3>
              <p className="specialty">{doctor.specialty}</p>
              <p className="bio">{doctor.bio}</p>
              <button className="cta-button" style={{ marginTop: '16px' }} onClick={scrollToBook}>
                Book Appointment
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
