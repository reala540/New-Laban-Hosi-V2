import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../server/db.js'
import { applyCors, noStore } from '../../server/cors.js'
import { withErrorHandling } from '../../server/errorHandler.js'
import { requireAdmin } from '../../server/auth.js'
import { asString, asMediaUrl, asSortOrder, isUuid } from '../../server/validate.js'

async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'GET, POST, PUT, DELETE, OPTIONS')) return
  noStore(res)
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    const rows = await sql`
      select id, name, specialty, bio, image_url as "imageUrl",
             sort_order as "sortOrder", created_at as "createdAt", updated_at as "updatedAt"
      from doctors order by sort_order asc, created_at asc
    `
    return res.status(200).json({ doctors: rows })
  }

  if (req.method === 'POST' || req.method === 'PUT') {
    const name = asString(req.body?.name, 120)
    const specialty = asString(req.body?.specialty, 120)
    const bio = asString(req.body?.bio, 1000)
    const imageUrl = asMediaUrl(req.body?.imageUrl)
    if (imageUrl === undefined) return res.status(400).json({ error: 'Invalid image' })
    if (!name || !specialty) return res.status(400).json({ error: 'Name and specialty are required' })

    const sortOrder = asSortOrder(req.body?.sortOrder)

    if (req.method === 'POST') {
      const rows = await sql`
        insert into doctors (name, specialty, bio, image_url, sort_order)
        values (${name}, ${specialty}, ${bio ?? ''}, ${imageUrl}, ${sortOrder})
        returning id
      `
      return res.status(200).json({ success: true, id: (rows as { id: string }[])[0]?.id })
    }

    const id = req.body?.id
    if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' })
    const rows = await sql`
      update doctors
      set name = ${name}, specialty = ${specialty}, bio = ${bio ?? ''},
          image_url = ${imageUrl}, sort_order = ${sortOrder}, updated_at = now()
      where id = ${id}
      returning id
    `
    if ((rows as unknown[]).length === 0) return res.status(404).json({ error: 'Doctor not found' })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const id = req.body?.id
    if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' })
    await sql`delete from doctors where id = ${id}`
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withErrorHandling('/api/admin/doctors', handler)
