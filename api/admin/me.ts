import type { VercelRequest, VercelResponse } from '@vercel/node'
import { applyCors, noStore } from '../../server/cors.js'
import { withErrorHandling } from '../../server/errorHandler.js'
import { isAuthenticated } from '../../server/auth.js'

/** Lets the admin UI ask "am I still signed in?" without leaking anything. */
async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'GET, OPTIONS')) return
  noStore(res)
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  return res.status(200).json({ authenticated: isAuthenticated(req) })
}

export default withErrorHandling('/api/admin/me', handler)
