import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../server/db.js'
import { applyCors } from '../server/cors.js'
import { withErrorHandling } from '../server/errorHandler.js'

async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'GET, OPTIONS')) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const [bannerRows, offers, services, doctors, gallery] = await Promise.all([
    sql`select active, message, type from banner limit 1`,
    sql`select id, title, description, image_url as "imageUrl", active, created_at as "createdAt"
        from offers where active = true order by sort_order asc, created_at asc`,
    sql`select id, name, description, icon
        from services order by sort_order asc, created_at asc`,
    sql`select id, name, specialty, bio, image_url as "imageUrl"
        from doctors order by sort_order asc, created_at asc`,
    sql`select id, type, blob_url as "url", caption
        from gallery_items order by created_at desc`
  ])

  const banner = bannerRows[0] || { active: false, message: '', type: 'info' }

  return res.status(200).json({ banner, offers, services, doctors, gallery })
}

export default withErrorHandling('/api/content', handler)
