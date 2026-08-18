import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * CORS + cache headers.
 *
 * This API is only ever called by the site itself (same origin), so we do
 * NOT send `Access-Control-Allow-Origin` at all: cross-origin browser calls
 * are refused by default. The previous version sent `ACAO: *`, which let any
 * website call these endpoints from a visitor's browser — removed on purpose.
 *
 * Returns true when the request was an OPTIONS preflight and has already
 * been answered (caller should return immediately).
 */
export function applyCors(
  req: VercelRequest,
  res: VercelResponse,
  methods: string
): boolean {
  res.setHeader('Access-Control-Allow-Methods', methods)
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Request')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}

/** Admin + submission responses must never be cached anywhere. */
export function noStore(res: VercelResponse): void {
  res.setHeader('Cache-Control', 'no-store, must-revalidate')
}
