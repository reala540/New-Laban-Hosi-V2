import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../../server/db.js'
import { applyCors, noStore } from '../../server/cors.js'
import { withErrorHandling } from '../../server/errorHandler.js'
import { requireAdmin } from '../../server/auth.js'
import { isUuid, oneOf } from '../../server/validate.js'

const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const

async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'GET, PATCH, OPTIONS')) return
  noStore(res)
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    const rows = await sql`
      select id, full_name as "fullName", email, phone, department,
             preferred_date as "preferredDate", message, status,
             created_at as "createdAt"
      from appointments order by created_at desc limit 200
    `
    return res.status(200).json({ appointments: rows })
  }

  if (req.method === 'PATCH') {
    const id = req.body?.id
    if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' })
    const status = oneOf(req.body?.status, STATUSES)
    if (!status) return res.status(400).json({ error: 'Invalid status' })

    const rows = await sql`
      update appointments set status = ${status} where id = ${id} returning id
    `
    if ((rows as unknown[]).length === 0) return res.status(404).json({ error: 'Appointment not found' })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export default withErrorHandling('/api/admin/appointments', handler)
