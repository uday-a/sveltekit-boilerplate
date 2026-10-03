import type { RequestHandler } from './$types'
import { requirePublic } from '$lib/server/guards'
import { jsonError, jsonOk } from '$lib/server/response'

// Example: PUBLIC API route.
//
// No auth check, no session read. Copy this shape for any endpoint that
// should be reachable by anonymous visitors (health checks, marketing
// page lookups, sitemap data, etc.).
//
// Try it:
//   curl http://localhost:5173/api/ping
//   → 200 { "ok": true, "data": { "status": "ok", "service": "...", "timestamp": "..." } }
export const GET: RequestHandler = async (event) => {
  try {
    requirePublic(event)
    return jsonOk({
      status: 'ok',
      service: 'sveltekit-boilerplate',
      timestamp: new Date().toISOString(),
    })
  }
  catch (err) {
    return jsonError(err)
  }
}
