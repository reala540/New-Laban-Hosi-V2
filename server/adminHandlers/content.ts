import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../db.js'
import { applyCors, noStore } from '../cors.js'
import { withErrorHandling } from '../errorHandler.js'
import { requireAdmin } from '../auth.js'
import { asString, asMediaUrl, asSortOrder, isBoolean, isUuid, oneOf } from '../validate.js'

/**
 * Consolidated admin content handlers. Each function below is the exact
 * logic of the original standalone route file (api/admin/banner.ts,
 * offers.ts, services.ts, doctors.ts, gallery.ts); only the import paths
 * changed because the code now lives in server/adminHandlers/.
 */

const BANNER_TYPES = ['holiday', 'offer', 'info'] as const

async function banner(req: VercelRequest, res: VercelResponse) {
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

async function offers(req: VercelRequest, res: VercelResponse) {
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

const ICON_KEYS = [
  'ambulance', 'clipboard', 'bed', 'baby', 'flask', 'pill',
  'scan', 'scissors', 'stethoscope', 'heart', 'activity', 'microscope'
] as const

async function services(req: VercelRequest, res: VercelResponse) {
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

async function doctors(req: VercelRequest, res: VercelResponse) {
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

async function gallery(req: VercelRequest, res: VercelResponse) {
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

export const bannerHandler = withErrorHandling('/api/admin/banner', banner)
export const offersHandler = withErrorHandling('/api/admin/offers', offers)
export const servicesHandler = withErrorHandling('/api/admin/services', services)
export const doctorsHandler = withErrorHandling('/api/admin/doctors', doctors)
export const galleryHandler = withErrorHandling('/api/admin/gallery', gallery)
