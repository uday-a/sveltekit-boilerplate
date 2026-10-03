import type { RequestHandler } from './$types'
import { requireAuth } from '$lib/server/guards'
import { jsonError, jsonOk } from '$lib/server/response'

// Example: AUTH-ONLY API route.
//
// `requireAuth(event)` throws 401 if the session is missing or invalid;
// jsonError() envelopes it as { ok: false, error: { code:
// 'UNAUTHORIZED', ... } }. Anything below requireAuth is guaranteed to
// run for an authenticated user.
//
// Try it (logged out):  curl -i http://localhost:5173/api/me
//   → 401 { "ok": false, "error": { "code": "UNAUTHORIZED", "message": "..." } }
// Try it (logged in):
//   → 200 { "ok": true, "data": { "user": { id, login, name, email, avatar, role }, "loggedInAt": ... } }
export const GET: RequestHandler = async (event) => {
  try {
    const { user, loggedInAt } = await requireAuth(event)
    return jsonOk({ user, loggedInAt })
  }
  catch (err) {
    return jsonError(err)
  }
}
