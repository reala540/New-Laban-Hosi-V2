import { useState } from 'react'
import { adminApi } from './adminApi'
import BannerEditor from './BannerEditor'
import ServicesEditor from './ServicesEditor'
import DoctorsEditor from './DoctorsEditor'
import OffersEditor from './OffersEditor'
import GalleryEditor from './GalleryEditor'
import AppointmentsView from './AppointmentsView'
import MessagesView from './MessagesView'
import PasswordForm from './PasswordForm'

const TABS = [
  { id: 'banner', label: 'Announcement Banner' },
  { id: 'services', label: 'Services' },
  { id: 'doctors', label: 'Doctors' },
  { id: 'offers', label: 'Offers' },
  { id: 'gallery', label: 'Gallery Photos' },
  { id: 'appointments', label: 'Appointment Requests' },
  { id: 'messages', label: 'Contact Messages' },
  { id: 'password', label: 'Change Password' }
] as const

type TabId = (typeof TABS)[number]['id']

export default function Dashboard({ onSignOut }: { onSignOut: () => void }) {
  const [tab, setTab] = useState<TabId>('banner')

  const signOut = async () => {
    try {
      await adminApi.post('/api/admin/logout')
    } catch {
      // even if the call fails, drop the local session state
    }
    onSignOut()
  }

  return (
    <div className="admin-root">
      <header className="admin-topbar">
        <div>
          <strong>The Laban Hospital</strong>
          <span className="admin-muted"> — Website Manager</span>
        </div>
        <div className="admin-topbar-actions">
          <a className="admin-btn admin-btn-ghost" href="/" target="_blank" rel="noopener noreferrer">
            View website
          </a>
          <button className="admin-btn admin-btn-ghost" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <nav className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`admin-tab ${tab === t.id ? 'admin-tab-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <main className="admin-main">
        {tab === 'banner' && <BannerEditor />}
        {tab === 'services' && <ServicesEditor />}
        {tab === 'doctors' && <DoctorsEditor />}
        {tab === 'offers' && <OffersEditor />}
        {tab === 'gallery' && <GalleryEditor />}
        {tab === 'appointments' && <AppointmentsView />}
        {tab === 'messages' && <MessagesView />}
        {tab === 'password' && <PasswordForm />}
      </main>
    </div>
  )
}
