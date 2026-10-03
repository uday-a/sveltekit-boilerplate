import { afterEach, describe, expect, it } from 'vitest'
import { webhooks } from '@polar-sh/sdk/2026-10'
import { env } from '$lib/server/env'
import { isPolarSignatureError, validatePolarEvent } from '$lib/server/polar'

// Webhook signature rejection. Pure HMAC verification — no network.
// The mock payload is well-formed but signed with the wrong key, so the
// SDK must reject it with PolarWebhookVerificationError.
const BODY = JSON.stringify({ type: 'subscription.created', data: { id: 'sub_mock' } })
const HEADERS = {
  'webhook-id': 'msg_mock0123456789',
  'webhook-timestamp': String(Math.floor(Date.now() / 1000)),
  'webhook-signature': 'v1,AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
}

const savedSecret = env.POLAR_WEBHOOK_SECRET

afterEach(() => {
  env.POLAR_WEBHOOK_SECRET = savedSecret
})

describe('SDK signature verification (mock payload)', () => {
  it('rejects a tampered payload with PolarWebhookVerificationError', async () => {
    await expect(webhooks.validateEvent(BODY, HEADERS, 'whsec_mock_secret_for_tests_only'))
      .rejects.toBeInstanceOf(webhooks.PolarWebhookVerificationError)
  })

  it('exposes the error class for instanceof narrowing', () => {
    expect(typeof webhooks.PolarWebhookVerificationError).toBe('function')
  })
})

describe('validatePolarEvent wrapper', () => {
  it('throws a clear error when the webhook secret is unconfigured', async () => {
    env.POLAR_WEBHOOK_SECRET = undefined
    await expect(validatePolarEvent(BODY, HEADERS)).rejects.toThrow('POLAR_WEBHOOK_SECRET is not configured')
  })

  it('propagates signature failures as PolarWebhookVerificationError', async () => {
    env.POLAR_WEBHOOK_SECRET = 'whsec_mock_secret_for_tests_only'
    const err = await validatePolarEvent(BODY, HEADERS).then(
      () => null,
      e => e as unknown
    )
    expect(err).toBeInstanceOf(webhooks.PolarWebhookVerificationError)
    await expect(isPolarSignatureError(err)).resolves.toBe(true)
  })

  it('isPolarSignatureError is false for ordinary errors', async () => {
    await expect(isPolarSignatureError(new Error('db down'))).resolves.toBe(false)
    await expect(isPolarSignatureError(null)).resolves.toBe(false)
  })
})
