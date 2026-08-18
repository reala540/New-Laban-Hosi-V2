import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AdminApp from './admin/AdminApp.tsx'
import PrivacyPolicy from './pages/PrivacyPolicy.tsx'
import TermsOfService from './pages/TermsOfService.tsx'
import NotFound from './pages/NotFound.tsx'

const path = window.location.pathname.replace(/\/+$/, '') || '/'

function Root() {
  // The admin panel only renders when the URL exactly matches the hidden
  // path baked in at build time. Any other /manage/* URL gets the same
  // generic not-found page as any other unknown URL, so the panel's
  // existence is never revealed.
  if (path.startsWith('/manage')) {
    return __ADMIN_PATH__ && path === __ADMIN_PATH__ ? <AdminApp /> : <NotFound />
  }
  if (path === '/privacy-policy') return <PrivacyPolicy />
  if (path === '/terms-of-service') return <TermsOfService />
  if (path === '' || path === '/') return <App />
  return <NotFound />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
