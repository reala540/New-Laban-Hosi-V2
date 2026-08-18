import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../server/db.js'
import { applyCors, noStore } from '../server/cors.js'
import { withErrorHandling } from '../server/errorHandler.js'
import { checkRateLimit } from '../server/rateLimit.js'
import { clientIp } from '../server/auth.js'
import {
  asString, asOptionalString, isEmail, isPhone, isDateString, oneOf
} from '../server/validate.js'

const DEPARTMENTS = [
  'Emergency', 'Outpatient', 'Maternity', 'Laboratory', 'Surgery', 'Radiology'
] as const

/**
 * Public endpoint: accepts new appointment requests from the website's
 * "Book Appointment" form. Every field is validated server-side, and the
 * endpoint is rate limited per IP to blunt spam/abuse.
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'POST, OPTIONS')) return
  noStore(res)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const allowed = await checkRateLimit(`form:appointments:${clientIp(req)}`, 5, 60 * 60)
  if (!allowed) {
    return res.status(429).json({ error: 'Too many submissions. Please call us at 0717 405 323 instead.' })
  }

  const fullName = asString(req.body?.fullName, 100)
  if (!fullName) return res.status(400).json({ error: 'Full name is required' })

  const email = asOptionalString(req.body?.email, 254)
  if (email === undefined || (email !== null && !isEmail(email))) {
    return res.status(400).json({ error: 'Please enter a valid email address' })
  }

  const phone = asOptionalString(req.body?.phone, 20)
  if (phone === undefined || (phone !== null && !isPhone(phone))) {
    return res.status(400).json({ error: 'Please enter a valid phone number' })
  }

  const department = req.body?.department ? oneOf(req.body.department, DEPARTMENTS) : null
  if (req.body?.department && !department) {
    return res.status(400).json({ error: 'Please choose a department from the list' })
  }

  const preferredDate = asOptionalString(req.body?.preferredDate, 10)
  if (preferredDate === undefined || (preferredDate !== null && !isDateString(preferredDate))) {
    return res.status(400).json({ error: 'Please enter a valid date' })
  }

  const message = asOptionalString(req.body?.message, 2000)
  if (message === undefined) return res.status(400).json({ error: 'Message is too long' })

  await sql`
    insert into appointments (full_name, email, phone, department, preferred_date, message)
    values (${fullName}, ${email}, ${phone}, ${department}, ${preferredDate}, ${message})
  `
  return res.status(200).json({ success: true })
}

export default withErrorHandling('/api/appointments', handler)
