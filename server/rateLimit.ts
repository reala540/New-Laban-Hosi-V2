import { sql } from './db.js'

/**
 * Database-backed fixed-window rate limiting.
 *
 * Lives in Postgres (not in memory) so the limit holds across serverless
 * invocations and instances. The `key` should namescope the limit, e.g.
 * `login:1.2.3.4` or `form:appointments:1.2.3.4`.
 *
 * Returns true when the request is ALLOWED, false when the limit was hit.
 */
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<boolean> {
  // Keep keys bounded so a crafted IP list can't grow the table forever.
  const safeKey = key.slice(0, 120)

  const rows = await sql`
    insert into rate_limits (key, count, window_start)
    values (${safeKey}, 1, now())
    on conflict (key) do update set
      count = case
        when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
          then 1
        else rate_limits.count + 1
      end,
      window_start = case
        when rate_limits.window_start < now() - make_interval(secs => ${windowSeconds})
          then now()
        else rate_limits.window_start
      end
    returning count
  `
  const count = Number((rows as { count: number }[])[0]?.count ?? 1)

  // Occasionally sweep expired windows so the table stays small.
  if (Math.random() < 0.01) {
    await sql`delete from rate_limits where window_start < now() - interval '1 day'`
  }

  return count <= limit
}
