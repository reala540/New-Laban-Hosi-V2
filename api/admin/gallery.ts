import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../server/db.js'
import { applyCors, noStore } from '../../server/cors.js'
import { withErrorHandling } from '../../server/errorHandler.js'
import { requireAdmin } from '../../server/auth.js'
import { asString, asMediaUrl, isUuid } from '../../server/validate.js'

async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'GET, POST, PUT, DELETE, OPTIONS')) return
  noStore(res)
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    const rows = await sql`
      select id, type, blob_url as "url", caption, created_at as "createdAt"
      from gallery_items order by created_at desc
    `
    return res.status(200).json({ gallery: rows })
  }

  if (req.method === 'POST') {
    // New gallery items always come from /api/admin/upload, so the URL must
    // be a same-origin media URL. Captions are plain text, capped.
    const url = asMediaUrl(req.body?.url)
    if (!url) return res.status(400).json({ error: 'A valid uploaded image is required' })
    const caption = asString(req.body?.caption, 200) ?? ''

    const rows = await sql`
      insert into gallery_items (type, blob_url, caption)
      values ('image', ${url}, ${caption})
      returning id
    `
    return res.status(200).json({ success: true, id: (rows as { id: string }[])[0]?.id })
  }

  if (req.method === 'PUT') {
    const id = req.body?.id
    if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' })
    const caption = asString(req.body?.caption, 200) ?? ''
    const rows = await sql`
      update gallery_items set caption = ${caption} where id = ${id} returning id
    `
    if ((rows as unknown[]).length === 0) return res.status(404).json({ error: 'Photo not found' })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'DELETE') {
    const id = req.body?.id
    if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' })

    // Remove the media bytes too when this item was the only one using them.
    const rows = (await sql`select blob_url from gallery_items where id = ${id}`) as {
      blob_url: string
    }[]
    await sql`delete from gallery_items where id = ${id}`
    const match = /^\/api\/media\?id=([0-9a-f-]{36})$/i.exec(rows[0]?.blob_url ?? '')
    if (match) {
      const stillUsed = await sql`select 1 from gallery_items where blob_url = ${rows[0].blob_url} limit 1`
      if ((stillUsed as unknown[]).length === 0) {
        await sql`delete from media where id = ${match[1]}`
      }
    }
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withErrorHandling('/api/admin/gallery', handler)
