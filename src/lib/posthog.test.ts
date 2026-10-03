import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PostHog } from 'posthog-js'
import { get } from 'svelte/store'

// NOTE: the factory must not reference outer locals or `vi` (hoisting) —
// plain functions + globalThis flags only. The flag lets the gating test
// prove the SDK module is never loaded when the key is empty.
vi.mock('posthog-js', () => {
  const g = globalThis as Record<string, unknown>
  g.__posthogJsImportCount = ((g.__posthogJsImportCount as number | undefined) ?? 0) + 1
  const calls: Array<{ key: string, options: unknown }> = []
  g.__posthogInitCalls = calls
  return {
    default: {
      init: (key: string, options: unknown) => { calls.push({ key, options }) },
      capture: (..._args: Array<unknown>) => {},
    },
  }
})

// Static import covers the pure helpers. initPostHog tests re-import fresh
// (vi.resetModules) so the import-count assertions are order-independent.
import {
  POSTHOG_DEFAULT_HOST,
  capturePageview,
  getPostHogConfig,
  isPostHogEnabled,
  posthog,
} from './posthog'

function mockGlobals() {
  return globalThis as Record<string, unknown> & {
    __posthogJsImportCount?: number
    __posthogInitCalls?: Array<{ key: string, options: Record<string, unknown> }>
  }
}

beforeEach(() => {
  posthog.set(undefined)
})

describe('isPostHogEnabled', () => {
  it.each([
    ['phc_abc123', true],
    ['  phc_abc123  ', true],
    ['', false],
    ['   ', false],
    [undefined, false],
    [null, false],
  ])('isPostHogEnabled(%j) → %j', (key, expected) => {
    expect(isPostHogEnabled(key)).toBe(expected)
  })
})

describe('getPostHogConfig', () => {
  it('mirrors the nuxt plugin options', () => {
    expect(getPostHogConfig('https://eu.i.posthog.com')).toEqual({
      api_host: 'https://eu.i.posthog.com',
      capture_pageview: false,
      capture_pageleave: true,
      autocapture: {
        dom_event_allowlist: ['click', 'submit', 'change'],
        element_attribute_ignorelist: ['data-private'],
      },
    })
  })

  it('defaults blank/missing hosts to us.i.posthog.com', () => {
    expect(getPostHogConfig(undefined)?.api_host).toBe(POSTHOG_DEFAULT_HOST)
    expect(getPostHogConfig(null)?.api_host).toBe(POSTHOG_DEFAULT_HOST)
    expect(getPostHogConfig('   ')?.api_host).toBe(POSTHOG_DEFAULT_HOST)
    expect(POSTHOG_DEFAULT_HOST).toBe('https://us.i.posthog.com')
  })
})

describe('capturePageview', () => {
  it('sends $pageview with $current_url', () => {
    const capture = vi.fn()
    capturePageview({ capture } as unknown as PostHog, 'https://acme.test/dashboard?x=1')
    expect(capture).toHaveBeenCalledWith('$pageview', { $current_url: 'https://acme.test/dashboard?x=1' })
  })

  it('no-ops on undefined/null clients (keyless boot)', () => {
    expect(() => capturePageview(undefined, 'https://acme.test/')).not.toThrow()
    expect(() => capturePageview(null, 'https://acme.test/')).not.toThrow()
  })
})

describe('initPostHog gating', () => {
  it('never imports posthog-js when the key is empty', async () => {
    vi.resetModules()
    const g = mockGlobals()
    delete g.__posthogJsImportCount
    const mod = await import('./posthog')

    await expect(mod.initPostHog('', 'https://us.i.posthog.com')).resolves.toBeUndefined()
    await expect(mod.initPostHog('   ', null)).resolves.toBeUndefined()
    await expect(mod.initPostHog(undefined, undefined)).resolves.toBeUndefined()
    await expect(mod.initPostHog(null, null)).resolves.toBeUndefined()

    expect(g.__posthogJsImportCount).toBeUndefined()
    expect(get(mod.posthog)).toBeUndefined()
  })

  it('dynamic-imports, inits and stores the client when configured', async () => {
    vi.resetModules()
    const g = mockGlobals()
    delete g.__posthogJsImportCount
    const mod = await import('./posthog')

    const client = await mod.initPostHog('phc_test_key', 'https://eu.i.posthog.com')

    expect(g.__posthogJsImportCount).toBe(1)
    expect(client).toBeDefined()
    expect(get(mod.posthog)).toBe(client)
    expect(g.__posthogInitCalls).toHaveLength(1)
    expect(g.__posthogInitCalls?.[0].key).toBe('phc_test_key')
    expect(g.__posthogInitCalls?.[0].options).toMatchObject({
      api_host: 'https://eu.i.posthog.com',
      capture_pageview: false,
      capture_pageleave: true,
    })
  })

  it('returns the existing client on re-init (HMR-safe)', async () => {
    vi.resetModules()
    const mod = await import('./posthog')
    const g = mockGlobals()
    // The mock module stays cached across resetModules, so its call log
    // accumulates — assert the delta, not the absolute length.
    const callsBefore = g.__posthogInitCalls?.length ?? 0
    const first = await mod.initPostHog('phc_test_key', null)
    const second = await mod.initPostHog('phc_other_key', null)
    expect(second).toBe(first)
    expect((g.__posthogInitCalls?.length ?? 0) - callsBefore).toBe(1)
  })
})
