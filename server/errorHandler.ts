import type { VercelRequest, VercelResponse } from '@vercel/node'

/**
 * Wraps a handler so any thrown error becomes a generic JSON 500 response
 * instead of a raw function crash (FUNCTION_INVOCATION_FAILED).
 *
 * The real error is logged server-side only. The client always receives the
 * same generic message so internals (SQL fragments, env names, file paths)
 * never leak into responses.
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
        res.status(500).json({ error: 'Something went wrong. Please try again later.' })
      }
    }
  }
}
