import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../server/db.js'
import { applyCors, noStore } from '../server/cors.js'
import { withErrorHandling } from '../server/errorHandler.js'
import { checkRateLimit } from '../server/rateLimit.js'
import { clientIp } from '../server/auth.js'
import { asString, asOptionalString, isEmail, isPhone } from '../server/validate.js'

/**
 * Public endpoint: accepts new contact-form messages. Every field is
 * validated server-side, and the endpoint is rate limited per IP.
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'POST, OPTIONS')) return
  noStore(res)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const allowed = await checkRateLimit(`form:messages:${clientIp(req)}`, 5, 60 * 60)
  if (!allowed) {
    return res.status(429).json({ error: 'Too many submissions. Please call us at 0717 405 323 instead.' })
  }

  const name = asString(req.body?.name, 100)
  if (!name) return res.status(400).json({ error: 'Name is required' })

  const email = asOptionalString(req.body?.email, 254)
  if (email === undefined || (email !== null && !isEmail(email))) {
    return res.status(400).json({ error: 'Please enter a valid email address' })
  }

  const phone = asOptionalString(req.body?.phone, 20)
  if (phone === undefined || (phone !== null && !isPhone(phone))) {
    return res.status(400).json({ error: 'Please enter a valid phone number' })
  }

  const message = asString(req.body?.message, 2000)
  if (!message) return res.status(400).json({ error: 'Message is required' })

  await sql`
    insert into contact_messages (name, email, phone, message)
    values (${name}, ${email}, ${phone}, ${message})
  `
  return res.status(200).json({ success: true })
}

export default withErrorHandling('/api/messages', handler)
