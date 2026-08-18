import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors, noStore } from '../../server/cors.js'
import { withErrorHandling } from '../../server/errorHandler.js'
import { clearSessionCookie, requireAdmin } from '../../server/auth.js'

async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'POST, OPTIONS')) return
  noStore(res)
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  if (!requireAdmin(req, res)) return

  clearSessionCookie(res)
  return res.status(200).json({ success: true })
}

export default withErrorHandling('/api/admin/logout', handler)
