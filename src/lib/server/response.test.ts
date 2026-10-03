import { describe, expect, it } from 'vitest'
import { redirect } from '@sveltejs/kit'
import { apiError, apiHandler, ApiError, ErrorCode, jsonError, jsonOk, ok, toFailure } from './response'

describe('ok', () => {
  it('wraps data in the success envelope', () => {
    expect(ok({ a: 1 })).toEqual({ ok: true, data: { a: 1 } })
  })
})

describe('apiError', () => {
  it('maps codes to status codes', () => {
    expect(apiError('UNAUTHORIZED', 'x').statusCode).toBe(401)
    expect(apiError('SESSION_INVALID', 'x').statusCode).toBe(401)
    expect(apiError('FORBIDDEN', 'x').statusCode).toBe(403)
    expect(apiError('NOT_FOUND', 'x').statusCode).toBe(404)
    expect(apiError('VALIDATION_FAILED', 'x').statusCode).toBe(422)
    expect(apiError('RATE_LIMITED', 'x').statusCode).toBe(429)
    expect(apiError('INTERNAL', 'x').statusCode).toBe(500)
  })

  it('carries code, message, and details', () => {
    const err = apiError('VALIDATION_FAILED', 'bad email', { field: 'email' })
    expect(err).toBeInstanceOf(ApiError)
    expect(err.code).toBe(ErrorCode.VALIDATION_FAILED)
    expect(err.message).toBe('bad email')
    expect(err.details).toEqual({ field: 'email' })
  })
})

describe('toFailure', () => {
  it('keeps typed ApiError code + status + details', () => {
    const { status, body } = toFailure(apiError('NOT_FOUND', 'nope', { id: 1 }))
    expect(status).toBe(404)
    expect(body).toEqual({ ok: false, error: { code: 'NOT_FOUND', message: 'nope', details: { id: 1 } } })
  })

  it('maps SvelteKit HttpError statuses to codes', () => {
    const { status, body } = toFailure({ status: 403, message: 'denied' })
    expect(status).toBe(403)
    expect(body.error.code).toBe('FORBIDDEN')
  })

  it('normalises unknown errors to 500 INTERNAL', () => {
    const { status, body } = toFailure(new Error('boom'))
    expect(status).toBe(500)
    expect(body.ok).toBe(false)
    expect(body.error.code).toBe('INTERNAL')
  })
})

describe('jsonOk / jsonError', () => {
  it('jsonOk returns a 200 Response with the success envelope', async () => {
    const res = jsonOk({ hello: 'world' })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, data: { hello: 'world' } })
  })

  it('jsonError returns the mapped status + failure envelope', async () => {
    const res = jsonError(apiError('FORBIDDEN', "role 'user' is not permitted"))
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      ok: false,
      error: { code: 'FORBIDDEN', message: "role 'user' is not permitted" },
    })
  })
})

describe('apiHandler', () => {
  const event = {} as Parameters<Parameters<typeof apiHandler>[0]>[0]

  it('envelopes a success return as { ok: true, data }', async () => {
    const handler = apiHandler(async () => ({ hello: 'world' }))
    const res = await handler(event) as Response
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true, data: { hello: 'world' } })
  })

  it('envelopes a thrown ApiError with its code + status', async () => {
    const handler = apiHandler(async () => {
      throw apiError('FORBIDDEN', "role 'user' is not permitted")
    })
    const res = await handler(event) as Response
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({
      ok: false,
      error: { code: 'FORBIDDEN', message: "role 'user' is not permitted" },
    })
  })

  it('normalises unknown errors to 500 INTERNAL', async () => {
    const handler = apiHandler(async () => {
      throw new Error('some internal boom')
    })
    const res = await handler(event) as Response
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.ok).toBe(false)
    expect(body.error.code).toBe('INTERNAL')
  })

  it('passes Response returns (streams, files) through untouched', async () => {
    const inner = new Response('raw', { status: 201 })
    const handler = apiHandler(async () => inner as unknown as never)
    const res = await handler(event) as Response
    expect(res.status).toBe(201)
    expect(await res.text()).toBe('raw')
  })

  it('rethrows SvelteKit redirects instead of enveloping them', async () => {
    const handler = apiHandler(async () => {
      redirect(302, '/login')
    })
    await expect(handler(event)).rejects.toMatchObject({ status: 302 })
  })
})
