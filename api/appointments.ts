import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../server/db.js'
import { applyCors } from '../server/cors.js'
import { withErrorHandling } from '../server/errorHandler.js'

// Public endpoint only: accepts new appointment requests from the website's
// "Book Appointment" form. Admin viewing/status-updating of submissions was
// removed along with the rest of the admin panel - the hospital now
// retrieves appointment requests directly from the database.
async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'POST, OPTIONS')) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { fullName, email, phone, department, preferredDate, message } = req.body || {}
  if (typeof fullName !== 'string' || !fullName.trim()) {
    return res.status(400).json({ error: 'Full name is required' })
  }

  await sql`
    insert into appointments (full_name, email, phone, department, preferred_date, message)
    values (${fullName}, ${email || null}, ${phone || null}, ${department || null}, ${preferredDate || null}, ${message || null})
  `
  return res.status(200).json({ success: true })
}

export default withErrorHandling('/api/appointments', handler)
