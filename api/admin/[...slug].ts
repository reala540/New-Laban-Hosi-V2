import type { VercelRequest, VercelResponse } from '@vercel/node'
import { withErrorHandling } from '../../server/errorHandler.js'
import {
  loginHandler,
  logoutHandler,
  meHandler,
  passwordHandler
} from '../../server/adminHandlers/auth.js'
import {
  bannerHandler,
  offersHandler,
  servicesHandler,
  doctorsHandler,
  galleryHandler
} from '../../server/adminHandlers/content.js'
import {
  appointmentsHandler,
  messagesHandler
} from '../../server/adminHandlers/inbox.js'

/**
 * Single catch-all serverless function for the admin API.
 *
 * Vercel turns every file under api/ into a separate serverless function,
 * and the Hobby plan allows at most 12 per deployment. The admin panel used
 * to have one file per endpoint (12 functions on its own); routing them all
 * through this one file keeps the public URL of every endpoint unchanged
 * (the frontend needs no changes) while counting as a single function.
 *
 * /api/admin/upload is intentionally NOT handled here: it keeps its own
 * route file (api/admin/upload.ts), which Vercel prefers over this catch-all,
 * so its 5mb body-parser limit stays scoped to uploads only.
 */

const routes: Record<
  string,
  (req: VercelRequest, res: VercelResponse) => Promise<void>
> = {
  login: loginHandler,
  logout: logoutHandler,
  me: meHandler,
  password: passwordHandler,
  banner: bannerHandler,
  offers: offersHandler,
  services: servicesHandler,
  doctors: doctorsHandler,
  gallery: galleryHandler,
  appointments: appointmentsHandler,
  messages: messagesHandler
}

async function handler(req: VercelRequest, res: VercelResponse) {
  // On Vercel's non-Next.js runtime, req.query is parsed from the URL query
  // string only — route parameters like [...slug] are NOT injected into
  // req.query. Parse the route segment from req.url instead.
  const url = req.url || ''
  const segments = url.replace(/^\/api\/admin\//, '').split('?')[0].split('/')

  // Only single-segment routes exist (e.g. /api/admin/offers). The bare
  // /api/admin path and anything deeper are not valid endpoints.
  if (segments.length !== 1 || !segments[0]) {
    return res.status(404).json({ error: 'Not found' })
  }

  const route = routes[segments[0]]
  if (!route) {
    return res.status(404).json({ error: 'Not found' })
  }

  return route(req, res)
}

export default withErrorHandling('/api/admin/[...slug]', handler)
