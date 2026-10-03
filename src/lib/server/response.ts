// Standard API response envelope. Port of nuxt-boilerplate
// server/utils/response.ts — same codes, same statuses, same shapes.
//
// Success:  { ok: true,  data:  <T> }
// Failure:  { ok: false, error: { code, message, details? } }
//
// SvelteKit adaptation: h3's defineEventHandler has no direct equivalent.
// Each +server.ts handler either try/catches with jsonOk()/jsonError() or
// wraps with apiHandler() below — same envelope either way. Use
// apiError(code, message) to fail with a typed code; anything else thrown
// (DB errors, SDK errors, HttpError from `error()`) is normalised into
// the envelope by toFailure()/jsonError().
//
//   import { apiError, jsonError, jsonOk } from '$lib/server/response'
//   export const GET: RequestHandler = async (event) => {
//     try {
//       const session = await requireAuth(event)
//       return jsonOk({ user: session.user })
//     }
//     catch (err) { return jsonError(err) }
//   }
//
// An apiHandler() wrapper (nuxt parity) is also provided for handlers that
// prefer it — same envelope, same codes, built on toFailure()/jsonOk().
// Redirects thrown inside apiHandler propagate untouched.

import type { RequestEvent, RequestHandler } from '@sveltejs/kit'

export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  SESSION_INVALID: 'SESSION_INVALID',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL',
} as const
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

const CODE_TO_STATUS: Record<ErrorCode, number> = {
  UNAUTHORIZED: 401,
  SESSION_INVALID: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_FAILED: 422,
  RATE_LIMITED: 429,
  INTERNAL: 500,
}

const STATUS_TO_CODE: Record<number, ErrorCode> = {
  401: ErrorCode.UNAUTHORIZED,
  403: ErrorCode.FORBIDDEN,
  404: ErrorCode.NOT_FOUND,
  422: ErrorCode.VALIDATION_FAILED,
  429: ErrorCode.RATE_LIMITED,
}

export interface ApiSuccess<T> { ok: true, data: T }
export interface ApiFailure { ok: false, error: { code: ErrorCode, message: string, details?: unknown } }
export type ApiResponse<T> = ApiSuccess<T> | ApiFailure

export function ok<T>(data: T): ApiSuccess<T> {
  return { ok: true, data }
}

// Throwable typed error. statusCode is derived from the code so call sites
// only name the failure mode:
//
//   throw apiError('FORBIDDEN', `role '${role}' is not permitted`)
//   throw apiError('VALIDATION_FAILED', 'email is required', { field: 'email' })
export class ApiError extends Error {
  readonly code: ErrorCode
  readonly statusCode: number
  readonly details?: unknown

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = CODE_TO_STATUS[code]
    this.details = details
  }
}

export function apiError(code: ErrorCode, message: string, details?: unknown): ApiError {
  return new ApiError(code, message, details)
}

// Normalise any thrown value into a status + envelope body. The HTTP status
// is preserved: typed ApiErrors carry their own, SvelteKit HttpErrors map
// through STATUS_TO_CODE, everything else is a 500 INTERNAL.
// Don't leak stack/url to clients — server logs keep the original.
export function toFailure(err: unknown): { status: number, body: ApiFailure } {
  if (err instanceof ApiError) {
    return {
      status: err.statusCode,
      body: {
        ok: false,
        error: {
          code: err.code,
          message: err.message,
          ...(err.details !== undefined ? { details: err.details } : {}),
        },
      },
    }
  }
  const e = err as { status?: number, statusCode?: number, message?: string }
  const status = e?.status ?? e?.statusCode ?? 500
  const code: ErrorCode = STATUS_TO_CODE[status] ?? ErrorCode.INTERNAL
  const message = typeof e?.message === 'string' && e.message ? e.message : 'Internal error'
  return { status, body: { ok: false, error: { code, message } } }
}

// Response helpers. Plain Response.json() (no @sveltejs/kit import) so this
// module stays importable from vitest without the SvelteKit plugin.
export function jsonOk<T>(data: T, status = 200): Response {
  return Response.json(ok(data), { status })
}

export function jsonError(err: unknown): Response {
  const { status, body } = toFailure(err)
  return Response.json(body, { status })
}

/**
 * Wrap a SvelteKit request handler so its return value is enveloped as
 * { ok: true, data } and any thrown error is enveloped via toFailure().
 * The HTTP status code is preserved. Response returns (redirects-as-data
 * aside) pass through untouched, and thrown SvelteKit redirect()s
 * propagate — they work by throwing a 3xx and must not be enveloped.
 *
 *   export const POST: RequestHandler = apiHandler(async (event) => {
 *     await requireAuth(event)
 *     return { hello: 'world' }
 *   })
 */
export function apiHandler<T>(fn: (event: RequestEvent) => T | Promise<T>): RequestHandler {
  const handler: RequestHandler = async (event) => {
    try {
      const data = await fn(event)
      // If the inner fn already returned a Response (streams, files),
      // pass it through untouched — don't envelope it.
      if (data instanceof Response) return data
      return jsonOk(data)
    }
    catch (err: unknown) {
      // SvelteKit redirect() must propagate — it works by throwing.
      // A redirect's status is 3xx; anything else is a real failure.
      const status = (err as { status?: number }).status
      if (typeof status === 'number' && status >= 300 && status < 400) throw err
      return jsonError(err)
    }
  }
  return handler
}
