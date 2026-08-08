import { neon } from '@neondatabase/serverless'

// Vercel's Neon integration commonly names this DATABASE_URL, but has used
// other names in the past (POSTGRES_URL, DATABASE_URL_UNPOOLED). We check
// the common ones so setup doesn't silently break over a naming mismatch.
const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED

if (!connectionString) {
  throw new Error(
    'No database connection string found. Set DATABASE_URL in your Vercel project (Storage -> your Neon database -> .env.local tab).'
  )
}

export const sql = neon(connectionString)
