import { useContent } from '../lib/ContentContext'

const NEW_BADGE_WINDOW_DAYS = 14

function isNew(createdAt?: string): boolean {
  if (!createdAt) return false
  const created = new Date(createdAt).getTime()
  if (Number.isNaN(created)) return false
  const ageDays = (Date.now() - created) / (1000 * 60 * 60 * 24)
  return ageDays >= 0 && ageDays < NEW_BADGE_WINDOW_DAYS
}

export default function Offers() {
  const { content, loading } = useContent()
  const activeOffers = content.offers.filter((offer) => offer.active)

  if (loading) {
    return (
      <section id="offers" className="offers">
        <div className="container">
          <h2 className="section-title">Current Offers</h2>
          <p className="section-subtitle">Special promotions and health awareness days</p>
          <div className="offers-scroll" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div className="skeleton skeleton-card offer-card-skeleton" key={i} />
            ))}
          </div>
        </div>
      </section>
    )
  }

  // Per spec: hide the section completely when there's nothing to show -
  // no heading, no empty-state message, nothing.
  if (activeOffers.length === 0) return null

  return (
    <section id="offers" className="offers">
      <div className="container">
        <h2 className="section-title reveal">Current Offers</h2>
        <p className="section-subtitle">Special promotions and health awareness days</p>
        <div className="offers-scroll">
          {activeOffers.map((offer, i) => (
            <div
              key={offer.id}
              className="offer-card reveal"
              style={{ transitionDelay: `${Math.min(i, 8) * 100}ms` }}
            >
              <div className="offer-image-wrap">
                {offer.imageUrl ? (
                  <img src={offer.imageUrl} alt={offer.title} className="offer-image" loading="lazy" />
                ) : (
                  <div className="offer-image-placeholder" aria-hidden="true" />
                )}
                {isNew(offer.createdAt) && <span className="offer-new-badge">New</span>}
              </div>
              <div className="offer-card-body">
                <h3>{offer.title}</h3>
                <p>{offer.description}</p>
                <a
                  className="offer-learn-more"
                  href="#appointment"
                  onClick={(e) => {
                    e.preventDefault()
                    document.getElementById('appointment')?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  Learn More
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
