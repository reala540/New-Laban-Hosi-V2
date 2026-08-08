import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Sets standard CORS + no-cache headers, and handles OPTIONS preflight.
 * Returns true if the request was an OPTIONS preflight and has already
 * been responded to (caller should `return` immediately in that case).
 */
export function applyCors(
  req: VercelRequest,
  res: VercelResponse,
  methods: string
): boolean {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', methods)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Cache-Control', 'no-store, must-revalidate')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return true
  }
  return false
}
