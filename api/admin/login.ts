import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../server/db.js'
import { applyCors, noStore } from '../../server/cors.js'
import { withErrorHandling } from '../../server/errorHandler.js'
import { checkRateLimit } from '../../server/rateLimit.js'
import {
  clientIp,
  createSessionToken,
  setSessionCookie,
  hashPassword,
  verifyPassword,
  safeEqual
} from '../../server/auth.js'

/**
 * Admin login. POST { password }.
 *
 * - Rate limited: 5 attempts per 15 minutes per IP, tracked in the database
 *   so it holds across serverless instances.
 * - On success sets an HttpOnly session cookie. The password itself is never
 *   stored in plaintext, never logged, and never returned.
 * - First run: if no password hash exists in the database yet, the password
 *   must match the ADMIN_INITIAL_PASSWORD env var; on that first successful
 *   login a proper scrypt hash is stored and the env var stops working
 *   (from then on, only the password set in the admin panel works).
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'POST, OPTIONS')) return
  noStore(res)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const allowed = await checkRateLimit(`login:${clientIp(req)}`, 5, 15 * 60)
  if (!allowed) {
    return res.status(429).json({ error: 'Too many attempts. Please wait 15 minutes and try again.' })
  }

  const { password } = req.body || {}
  if (typeof password !== 'string' || password.length === 0 || password.length > 200) {
    return res.status(400).json({ error: 'Invalid request' })
  }

  const rows = (await sql`select value from admin_settings where key = 'password_hash'`) as {
    value: string
  }[]
  const storedHash = rows[0]?.value

  let ok = false
  if (storedHash) {
    ok = await verifyPassword(password, storedHash)
  } else {
    // Bootstrap path: only works until the first successful login.
    const initial = process.env.ADMIN_INITIAL_PASSWORD
    if (initial && safeEqual(password, initial)) {
      await sql`
        insert into admin_settings (key, value) values ('password_hash', ${await hashPassword(password)})
        on conflict (key) do update set value = excluded.value
      `
      ok = true
    }
  }

  if (!ok) {
    // Same message either way — don't reveal whether a password is set.
    return res.status(401).json({ error: 'Incorrect password' })
  }

  setSessionCookie(res, createSessionToken())
  return res.status(200).json({ success: true })
}

export default withErrorHandling('/api/admin/login', handler)
