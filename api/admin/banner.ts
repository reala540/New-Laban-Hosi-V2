import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../server/db.js'
import { applyCors, noStore } from '../../server/cors.js'
import { withErrorHandling } from '../../server/errorHandler.js'
import { requireAdmin } from '../../server/auth.js'
import { asString, isBoolean, oneOf } from '../../server/validate.js'

const BANNER_TYPES = ['holiday', 'offer', 'info'] as const

async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'GET, PUT, OPTIONS')) return
  noStore(res)
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    const rows = await sql`
      select active, message, type, updated_at as "updatedAt" from banner limit 1
    `
    return res.status(200).json({ banner: (rows as unknown[])[0] || { active: false, message: '', type: 'info' } })
  }

  if (req.method === 'PUT') {
    const active = isBoolean(req.body?.active) ? req.body.active : false
    const message = asString(req.body?.message, 300) ?? ''
    const type = oneOf(req.body?.type, BANNER_TYPES) ?? 'info'

    await sql`
      update banner set active = ${active}, message = ${message}, type = ${type}, updated_at = now()
    `
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withErrorHandling('/api/admin/banner', handler)
