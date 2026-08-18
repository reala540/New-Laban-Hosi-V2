import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../server/db.js'
import { applyCors } from '../server/cors.js'
import { withErrorHandling } from '../server/errorHandler.js'
import { isUuid } from '../server/validate.js'

/**
 * Public image delivery for admin-uploaded photos (gallery, doctors, offers).
 * Read-only; the id must be a UUID, so there is nothing to traverse or inject.
 * Responses are immutable and cached aggressively by the CDN and browsers.
 */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'GET, OPTIONS')) return
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const id = req.query.id
  if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' })

  const rows = (await sql`
    select content_type as "contentType", encode(data, 'base64') as b64
    from media where id = ${id}
  `) as { contentType: string; b64: string }[]

  const row = rows[0]
  if (!row) return res.status(404).json({ error: 'Not found' })

  const buf = Buffer.from(row.b64, 'base64')
  res.setHeader('Content-Type', row.contentType)
  res.setHeader('Content-Length', String(buf.length))
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  return res.status(200).send(buf)
}

export default withErrorHandling('/api/media', handler)
