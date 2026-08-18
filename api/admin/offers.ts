import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../server/db.js'
import { applyCors, noStore } from '../../server/cors.js'
import { withErrorHandling } from '../../server/errorHandler.js'
import { requireAdmin } from '../../server/auth.js'
import { asString, asMediaUrl, asSortOrder, isBoolean, isUuid } from '../../server/validate.js'

async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'GET, POST, PUT, DELETE, OPTIONS')) return
  noStore(res)
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    const rows = await sql`
      select id, title, description, image_url as "imageUrl", active,
             sort_order as "sortOrder", created_at as "createdAt", updated_at as "updatedAt"
      from offers order by sort_order asc, created_at asc
    `
    return res.status(200).json({ offers: rows })
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const title = asString(req.body?.title, 150)
    const description = asString(req.body?.description, 600)
    const imageUrl = asMediaUrl(req.body?.imageUrl)
    if (imageUrl === undefined) return res.status(400).json({ error: 'Invalid image' })
    if (!title || !description) return res.status(400).json({ error: 'Title and description are required' })

    const active = isBoolean(req.body?.active) ? req.body.active : true
    const sortOrder = asSortOrder(req.body?.sortOrder)

    if (req.method === 'POST') {
      const rows = await sql`
        insert into offers (title, description, image_url, active, sort_order)
        values (${title}, ${description}, ${imageUrl}, ${active}, ${sortOrder})
        returning id
      `
      return res.status(200).json({ success: true, id: (rows as { id: string }[])[0]?.id })
    }

    const id = req.body?.id
    if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' })
    const rows = await sql`
      update offers
      set title = ${title}, description = ${description}, image_url = ${imageUrl},
          active = ${active}, sort_order = ${sortOrder}, updated_at = now()
      where id = ${id}
      returning id
    `
    if ((rows as unknown[]).length === 0) return res.status(404).json({ error: 'Offer not found' })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const id = req.body?.id
    if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' })
    await sql`delete from offers where id = ${id}`
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withErrorHandling('/api/admin/offers', handler)
