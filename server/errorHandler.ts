import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Wraps a handler so any thrown error becomes a proper JSON 500 response
 * instead of a raw function crash (FUNCTION_INVOCATION_FAILED).
 */
export function withErrorHandling(
  routeName: string,
  handler: (req: VercelRequest, res: VercelResponse) => Promise<unknown>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      await handler(req, res)
    } catch (err) {
      console.error(`Unhandled error in ${routeName}:`, err)
      if (!res.headersSent) {
        res.status(500).json({ error: (err as Error).message || 'Unknown server error' })
      }
    }
  }
}
