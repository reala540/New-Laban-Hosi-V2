import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../server/db.js'
import { applyCors, noStore } from '../../server/cors.js'
import { withErrorHandling } from '../../server/errorHandler.js'
import { requireAdmin, hashPassword, verifyPassword, clientIp } from '../../server/auth.js'
import { checkRateLimit } from '../../server/rateLimit.js'

/**
 * Change the admin password. Requires the current password, enforces a
 * minimum strength, and is rate limited. Passwords are never logged.
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'POST, OPTIONS')) return
  noStore(res)
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!requireAdmin(req, res)) return

  const allowed = await checkRateLimit(`pwchange:${clientIp(req)}`, 10, 60 * 60)
  if (!allowed) {
    return res.status(429).json({ error: 'Too many attempts. Please try again later.' })
  }

  const { currentPassword, newPassword } = req.body || {}
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return res.status(400).json({ error: 'Invalid request' })
  }
  if (newPassword.length < 10 || newPassword.length > 200) {
    return res.status(400).json({ error: 'New password must be at least 10 characters long' })
  }

  const rows = (await sql`select value from admin_settings where key = 'password_hash'`) as {
    value: string
  }[]
  const storedHash = rows[0]?.value
  if (!storedHash || !(await verifyPassword(currentPassword, storedHash))) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }

  await sql`
    update admin_settings set value = ${await hashPassword(newPassword)} where key = 'password_hash'
  `
  return res.status(200).json({ success: true })
}

export default withErrorHandling('/api/admin/password', handler)
