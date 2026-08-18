import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../server/db.js'
import { applyCors, noStore } from '../../server/cors.js'
import { withErrorHandling } from '../../server/errorHandler.js'
import { requireAdmin } from '../../server/auth.js'
import { asString, asSortOrder, isUuid } from '../../server/validate.js'

const ICON_KEYS = [
  'ambulance', 'clipboard', 'bed', 'baby', 'flask', 'pill',
  'scan', 'scissors', 'stethoscope', 'heart', 'activity', 'microscope'
] as const

async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'GET, POST, PUT, DELETE, OPTIONS')) return
  noStore(res)
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    const rows = await sql`
      select id, name, description, icon, sort_order as "sortOrder",
             created_at as "createdAt", updated_at as "updatedAt"
      from services order by sort_order asc, created_at asc
    `
    return res.status(200).json({ services: rows })
  }

  if (req.method === 'POST') {
    const name = asString(req.body?.name, 120)
    const description = asString(req.body?.description, 500)
    const iconInput = asString(req.body?.icon, 40)?.toLowerCase()
    const icon = iconInput && (ICON_KEYS as readonly string[]).includes(iconInput) ? iconInput : 'stethoscope'
    if (!name || !description) return res.status(400).json({ error: 'Name and description are required' })

    const sortOrder = asSortOrder(req.body?.sortOrder)
    const rows = await sql`
      insert into services (name, description, icon, sort_order)
      values (${name}, ${description}, ${icon}, ${sortOrder})
      returning id
    `
    return res.status(200).json({ success: true, id: (rows as { id: string }[])[0]?.id })
  }

  if (req.method === 'PUT') {
    const id = req.body?.id
    if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' })
    const name = asString(req.body?.name, 120)
    const description = asString(req.body?.description, 500)
    const iconInput = asString(req.body?.icon, 40)?.toLowerCase()
    const icon = iconInput && (ICON_KEYS as readonly string[]).includes(iconInput) ? iconInput : 'stethoscope'
    if (!name || !description) return res.status(400).json({ error: 'Name and description are required' })

    const sortOrder = asSortOrder(req.body?.sortOrder)
    const rows = await sql`
      update services
      set name = ${name}, description = ${description}, icon = ${icon},
          sort_order = ${sortOrder}, updated_at = now()
      where id = ${id}
      returning id
    `
    if ((rows as unknown[]).length === 0) return res.status(404).json({ error: 'Service not found' })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const id = req.body?.id
    if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' })
    await sql`delete from services where id = ${id}`
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withErrorHandling('/api/admin/services', handler)
