import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../server/db.js'
import { applyCors } from '../server/cors.js'
import { withErrorHandling } from '../server/errorHandler.js'

// Public endpoint only: accepts new contact-form messages. Admin
// viewing/status-updating of messages was removed along with the rest of
// the admin panel - the hospital now retrieves messages directly from the
// database.
async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'POST, OPTIONS')) return

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, phone, message } = req.body || {}
  if (typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Name is required' })
  }

  await sql`
    insert into contact_messages (name, email, phone, message)
    values (${name}, ${email || null}, ${phone || null}, ${message || null})
  `
  return res.status(200).json({ success: true })
}

export default withErrorHandling('/api/messages', handler)
