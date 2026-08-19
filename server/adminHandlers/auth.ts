import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../db.js'
import { applyCors, noStore } from '../cors.js'
import { withErrorHandling } from '../errorHandler.js'
import { checkRateLimit } from '../rateLimit.js'
import {
  clientIp,
  createSessionToken,
  setSessionCookie,
  clearSessionCookie,
  isAuthenticated,
  requireAdmin,
  hashPassword,
  verifyPassword,
  safeEqual
} from '../auth.js'

/**
 * Consolidated admin authentication handlers. Each function below is the
 * exact logic of the original standalone route file (api/admin/login.ts,
 * logout.ts, me.ts, password.ts); only the import paths changed because the
 * code now lives in server/adminHandlers/ instead of api/admin/.
 */

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
async function login(req: VercelRequest, res: VercelResponse) {
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

async function logout(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'POST, OPTIONS')) return
  noStore(res)
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!requireAdmin(req, res)) return

  clearSessionCookie(res)
  return res.status(200).json({ success: true })
}

/** Lets the admin UI ask "am I still signed in?" without leaking anything. */
async function me(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'GET, OPTIONS')) return
  noStore(res)
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  return res.status(200).json({ authenticated: isAuthenticated(req) })
}

/**
 * Change the admin password. Requires the current password, enforces a
 * minimum strength, and is rate limited. Passwords are never logged.
 */
async function password(req: VercelRequest, res: VercelResponse) {
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

export const loginHandler = withErrorHandling('/api/admin/login', login)
export const logoutHandler = withErrorHandling('/api/admin/logout', logout)
export const meHandler = withErrorHandling('/api/admin/me', me)
export const passwordHandler = withErrorHandling('/api/admin/password', password)
