import { describe, expect, it } from 'vitest'
import { cn, safeRedirectPath, formatMoney, formatNumber } from './utils'

describe('cn', () => {
  it('merges class names with tailwind conflict resolution', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

describe('safeRedirectPath', () => {
  it('accepts internal paths', () => {
    expect(safeRedirectPath('/settings?tab=billing')).toBe('/settings?tab=billing')
  })

  it('rejects external urls', () => {
    expect(safeRedirectPath('https://evil.com')).toBe('/dashboard')
  })
})

describe('formatMoney / formatNumber (Rule15 centralization)', () => {
  it('formats USD with grouping and renders zero as $0 (never an em-dash)', () => {
    expect(formatMoney(4800)).toBe('$4,800')
    expect(formatMoney(0)).toBe('$0')
    expect(formatMoney(115700)).toBe('$115,700')
  })

  it('formats plain counts with grouping', () => {
    expect(formatNumber(1221)).toBe('1,221')
    expect(formatNumber(0)).toBe('0')
  })
})
