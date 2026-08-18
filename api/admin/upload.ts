import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../server/db.js'
import { applyCors, noStore } from '../../server/cors.js'
import { withErrorHandling } from '../../server/errorHandler.js'
import { requireAdmin, clientIp } from '../../server/auth.js'
import { checkRateLimit } from '../../server/rateLimit.js'

// Base64 inflates size by ~4/3; 3.5M chars of base64 ≈ 2.6 MB of real data.
const MAX_BASE64_LENGTH = 3_500_000
const MAX_FILE_BYTES = 2 * 1024 * 1024 // 2 MB hard cap on the decoded file

/**
 * Detect the real file type from magic bytes. The browser's claimed
 * filename and MIME type are never trusted.
 */
function detectImageType(buf: Buffer): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg'
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return 'image/png'
  if (
    buf.length >= 12 &&
    buf.toString('ascii', 0, 4) === 'RIFF' &&
    buf.toString('ascii', 8, 12) === 'WEBP'
  ) return 'image/webp'
  return null
}

export const config = {
  api: {
    bodyParser: { sizeLimit: '5mb' }
  }
}

/**
 * Admin image upload. Accepts JSON { dataBase64 } and stores the decoded
 * bytes in the media table, returning a same-origin /api/media?id=... URL.
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'POST, OPTIONS')) return
  noStore(res)
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!requireAdmin(req, res)) return

  const allowed = await checkRateLimit(`upload:${clientIp(req)}`, 30, 60 * 60)
  if (!allowed) {
    return res.status(429).json({ error: 'Too many uploads. Please wait a while and try again.' })
  }

  const { dataBase64 } = req.body || {}
  if (typeof dataBase64 !== 'string' || dataBase64.length === 0) {
    return res.status(400).json({ error: 'No file received' })
  }
  if (dataBase64.length > MAX_BASE64_LENGTH) {
    return res.status(400).json({ error: 'File is too large. Maximum size is 2 MB.' })
  }
  if (!/^[A-Za-z0-9+/=\r\n]+$/.test(dataBase64)) {
    return res.status(400).json({ error: 'Invalid file data' })
  }

  const buf = Buffer.from(dataBase64, 'base64')
  if (buf.length === 0) return res.status(400).json({ error: 'Invalid file data' })
  if (buf.length > MAX_FILE_BYTES) {
    return res.status(400).json({ error: 'File is too large. Maximum size is 2 MB.' })
  }

  const contentType = detectImageType(buf)
  if (!contentType) {
    return res.status(400).json({ error: 'Only JPG, PNG or WebP images are allowed' })
  }

  const b64 = buf.toString('base64')
  const rows = await sql`
    insert into media (content_type, size_bytes, data)
    values (${contentType}, ${buf.length}, decode(${b64}, 'base64'))
    returning id
  `
  const id = (rows as { id: string }[])[0]?.id
  return res.status(200).json({ success: true, url: `/api/media?id=${id}` })
}

export default withErrorHandling('/api/admin/upload', handler)
