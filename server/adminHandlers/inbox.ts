import type { VercelRequest, VercelResponse } from '@vercel/node'
import { sql } from '../db.js'
import { applyCors, noStore } from '../cors.js'
import { withErrorHandling } from '../errorHandler.js'
import { requireAdmin } from '../auth.js'
import { isUuid, oneOf } from '../validate.js'

/**
 * Consolidated admin inbox handlers. Each function below is the exact logic
 * of the original standalone route file (api/admin/appointments.ts and
 * api/admin/messages.ts); only the import paths changed because the code now
 * lives in server/adminHandlers/.
 */

const APPOINTMENT_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const

async function appointments(req: VercelRequest, res: VercelResponse) {
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
    const status = oneOf(req.body?.status, APPOINTMENT_STATUSES)
    if (!status) return res.status(400).json({ error: 'Invalid status' })

    const rows = await sql`
      update appointments set status = ${status} where id = ${id} returning id
    `
    if ((rows as unknown[]).length === 0) return res.status(404).json({ error: 'Appointment not found' })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

const MESSAGE_STATUSES = ['new', 'read', 'resolved'] as const

async function messages(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res, 'GET, PATCH, OPTIONS')) return
  noStore(res)
  if (!requireAdmin(req, res)) return

  if (req.method === 'GET') {
    const rows = await sql`
      select id, name, email, phone, message, status, created_at as "createdAt"
      from contact_messages order by created_at desc limit 200
    `
    return res.status(200).json({ messages: rows })
  }

  if (req.method === 'PATCH') {
    const id = req.body?.id
    if (!isUuid(id)) return res.status(400).json({ error: 'Invalid id' })
    const status = oneOf(req.body?.status, MESSAGE_STATUSES)
    if (!status) return res.status(400).json({ error: 'Invalid status' })

    const rows = await sql`
      update contact_messages set status = ${status} where id = ${id} returning id
    `
    if ((rows as unknown[]).length === 0) return res.status(404).json({ error: 'Message not found' })
    return res.status(200).json({ success: true })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}

export const appointmentsHandler = withErrorHandling('/api/admin/appointments', appointments)
export const messagesHandler = withErrorHandling('/api/admin/messages', messages)
