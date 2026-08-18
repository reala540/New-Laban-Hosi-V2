import crypto from 'node:crypto'
import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Admin session handling.
 *
 * Sessions are stateless: the cookie value is `${expiryMs}.${hmac}` where the
 * HMAC is computed with SESSION_SECRET (server-only env var). The cookie is
 * HttpOnly (JS can't read it), Secure (HTTPS only) and SameSite=Strict (the
 * browser won't send it on cross-site requests, which blocks CSRF by
 * default). On top of that, every mutating admin request must carry a custom
 * header and a matching Origin — see requireAdmin().
 */

const SESSION_TTL_MS = 8 * 60 * 60 * 1000 // 8 hours
export const SESSION_COOKIE = 'laban_admin'

function getSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('SESSION_SECRET is missing or too short')
  }
  return secret
}

function sign(payload: string): string {
  return crypto.createHmac('sha256', getSecret()).update(payload).digest('hex')
}

export function createSessionToken(): string {
  const expiry = Date.now() + SESSION_TTL_MS
  const payload = `admin:${expiry}`
  return `${expiry}.${sign(payload)}`
}

export function verifySessionToken(token: string | undefined | null): boolean {
  if (!token || typeof token !== 'string') return false
  const dot = token.indexOf('.')
  if (dot <= 0) return false
  const expiry = Number(token.slice(0, dot))
  const givenMac = token.slice(dot + 1)
  if (!Number.isFinite(expiry) || expiry < Date.now()) return false
  if (!/^[a-f0-9]{64}$/.test(givenMac)) return false
  const expectedMac = sign(`admin:${expiry}`)
  // Timing-safe comparison so response time doesn't leak the signature.
  try {
    return crypto.timingSafeEqual(Buffer.from(givenMac), Buffer.from(expectedMac))
  } catch {
    return false
  }
}

function readCookie(req: VercelRequest, name: string): string | undefined {
  const header = req.headers.cookie
  if (!header) return undefined
  for (const part of header.split(';')) {
    const [k, ...rest] = part.trim().split('=')
    if (k === name) return decodeURIComponent(rest.join('='))
  }
  return undefined
}

export function setSessionCookie(res: VercelResponse, token: string): void {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_MS / 1000}`
  )
}

export function clearSessionCookie(res: VercelResponse): void {
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`
  )
}

export function isAuthenticated(req: VercelRequest): boolean {
  return verifySessionToken(readCookie(req, SESSION_COOKIE))
}

/**
 * Gate for every /api/admin/* route (except login). Returns true when the
 * request is allowed to proceed; otherwise it has already sent a 401/403
 * response and the caller must return immediately.
 *
 * Checks, in order:
 *  1. Valid, unexpired session cookie (authentication).
 *  2. For state-changing methods: a custom header that browsers will not
 *     attach cross-site without a CORS preflight (CSRF defence in depth,
 *     on top of SameSite=Strict).
 *  3. For state-changing methods: if an Origin header is present, its host
 *     must match the Host the request was sent to.
 */
export function requireAdmin(req: VercelRequest, res: VercelResponse): boolean {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'Not signed in' })
    return false
  }

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
    if (req.headers['x-admin-request'] !== '1') {
      res.status(403).json({ error: 'Forbidden' })
      return false
    }
    const origin = req.headers.origin
    if (origin) {
      try {
        const originHost = new URL(origin).host
        if (originHost !== req.headers.host) {
          res.status(403).json({ error: 'Forbidden' })
          return false
        }
      } catch {
        res.status(403).json({ error: 'Forbidden' })
        return false
      }
    }
  }
  return true
}

/** Timing-safe string comparison for secrets such as the bootstrap password. */
export function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a)
  const bb = Buffer.from(b)
  if (ba.length !== bb.length) return false
  return crypto.timingSafeEqual(ba, bb)
}

/**
 * Password hashing with Node's built-in scrypt (no external dependency).
 * Stored format: scrypt:<N>:<r>:<p>:<salt hex>:<hash hex>
 */
const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const KEY_LEN = 64

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16)
  const derived = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, KEY_LEN, { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P }, (err, key) =>
      err ? reject(err) : resolve(key)
    )
  })
  return `scrypt:${SCRYPT_N}:${SCRYPT_R}:${SCRYPT_P}:${salt.toString('hex')}:${derived.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, n, r, p, saltHex, hashHex] = stored.split(':')
    if (scheme !== 'scrypt') return false
    const salt = Buffer.from(saltHex, 'hex')
    const expected = Buffer.from(hashHex, 'hex')
    const derived = await new Promise<Buffer>((resolve, reject) => {
      crypto.scrypt(
        password,
        salt,
        expected.length,
        { N: Number(n), r: Number(r), p: Number(p) },
        (err, key) => (err ? reject(err) : resolve(key))
      )
    })
    return crypto.timingSafeEqual(derived, expected)
  } catch {
    return false
  }
}

/** Best-effort client IP for rate limiting (Vercel sets x-forwarded-for). */
export function clientIp(req: VercelRequest): string {
  const fwd = req.headers['x-forwarded-for']
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim()
  if (Array.isArray(fwd) && fwd.length > 0) return fwd[0]
  return req.socket?.remoteAddress || 'unknown'
}
