import { useContent } from '../lib/ContentContext'
import { ServiceIcon } from '../lib/icons'

export default function Services() {
  const { content, loading } = useContent()
  const services = content.services

  if (loading) {
    return (
      <section id="services" className="services">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <p className="section-subtitle">
            Comprehensive medical services designed to meet all your healthcare needs
          </p>
          <div className="services-grid" aria-hidden="true">
            {[0, 1, 2, 3].map((i) => (
              <div className="skeleton skeleton-card" key={i} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Per spec: hide this section completely (no heading, nothing) if there
  // are no services yet, rather than showing an empty grid or a fallback
  // list that doesn't reflect what's actually in the database.
  if (services.length === 0) return null

  return (
    <section id="services" className="services">
      <div className="container">
        <h2 className="section-title reveal">Our Services</h2>
        <p className="section-subtitle">
          Comprehensive medical services designed to meet all your healthcare needs
        </p>
        <div className="services-grid">
          {services.map((service, i) => (
            <div
              key={service.id}
              className="service-card reveal"
              style={{ transitionDelay: `${Math.min(i, 8) * 100}ms` }}
            >
              <div className="service-icon">
                <ServiceIcon icon={service.icon} />
              </div>
              <h3>{service.name}</h3>
              <p>{service.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
