export interface Banner {
  active: boolean
  message: string
  type: 'holiday' | 'offer' | 'info'
}

export interface Offer {
  id: string
  title: string
  description: string
  imageUrl?: string
  active: boolean
  createdAt?: string
}

export interface ServiceItem {
  id: string
  name: string
  description: string
  icon: string
}

export interface Doctor {
  id: string
  name: string
  specialty: string
  bio: string
  imageUrl?: string
}

export interface GalleryItem {
  id: string
  type: 'image' | 'video'
  url: string
  caption?: string
}

export interface SiteContent {
  banner: Banner
  offers: Offer[]
  services: ServiceItem[]
  doctors: Doctor[]
  gallery: GalleryItem[]
}

export const emptyContent: SiteContent = {
  banner: { active: false, message: '', type: 'info' },
  offers: [],
  services: [],
  doctors: [],
  gallery: []
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  let message = fallback
  try {
    const data = await res.json()
    message = data.error || fallback
  } catch {
    // response wasn't JSON - keep the fallback
  }
  return `${message} (HTTP ${res.status})`
}

// ---------------------------------------------------------------------------
// Public content (single combined fetch for the whole public site)
// ---------------------------------------------------------------------------

export async function fetchContent(): Promise<SiteContent> {
  const res = await fetch('/api/content')
  if (!res.ok) throw new Error(await parseErrorMessage(res, 'Failed to load site content'))
  return res.json()
}

// ---------------------------------------------------------------------------
// Public forms - appointments & contact messages
// ---------------------------------------------------------------------------

export async function submitAppointment(payload: Record<string, unknown>): Promise<void> {
  const res = await fetch('/api/appointments', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(await parseErrorMessage(res, 'Failed to book appointment'))
}

export async function submitMessage(payload: Record<string, unknown>): Promise<void> {
  const res = await fetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  if (!res.ok) throw new Error(await parseErrorMessage(res, 'Failed to send message'))
}
