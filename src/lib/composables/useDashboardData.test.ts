// Guards the dashboard funnel contract: per-range data updates (incl.
// custom), the bar-compatible funnelOption shape (never a triangle series),
// and the range-aware funnelSummary the card subtitle/footer read.
import { describe, expect, it, vi } from 'vitest'

// useDashboardData embeds @lucide/svelte icons in its activity/alert rows;
// vitest has no .svelte transform, so stub the icon components. The funnel
// assertions below never render them.
vi.mock('@lucide/svelte', () => {
  const icon = () => null
  return {
    AlertTriangle: icon,
    CheckCircle2: icon,
    CreditCard: icon,
    GitBranch: icon,
    Info: icon,
    MessageSquare: icon,
    ShieldAlert: icon,
    UserPlus: icon,
  }
})

import { formatPct, formatStepRatesLine } from '$lib/funnel'
import { useDashboardData } from './useDashboardData'

describe('dashboard funnel wiring', () => {
  it('exposes the 30d demo funnel with exact counts', () => {
    const data = useDashboardData('30d')
    expect(data.funnel.map(f => f.value)).toEqual([24850, 14910, 5964, 1789, 447])
    expect(data.funnelSummary.visitors).toBe(24850)
    expect(data.funnelSummary.retained).toBe(447)
    expect(formatPct(data.funnelSummary.endToEnd)).toBe('1.8%')
    expect(formatStepRatesLine(data.funnelSummary)).toBe('Step rates: 60% → 40% → 30% → 25%')
  })

  it('updates counts + summary when the range changes', () => {
    expect(useDashboardData('30d').funnelSummary.visitors).toBe(24850)
    const day = useDashboardData('24h')
    expect(day.funnel.map(f => f.value)).toEqual([1000, 600, 240, 72, 18])
    expect(day.funnelSummary.visitors).toBe(1000)
    expect(day.funnelSummary.retained).toBe(18)
    expect(formatStepRatesLine(day.funnelSummary)).toBe('Step rates: 60% → 40% → 30% → 25%')
    expect(useDashboardData('7d').funnel.map(f => f.value)).toEqual([6000, 3600, 1440, 432, 108])
  })

  it('keeps custom range ratio-clean too', () => {
    const data = useDashboardData('custom')
    expect(data.funnelSummary.visitors).toBe(14900)
    expect(formatStepRatesLine(data.funnelSummary)).toBe('Step rates: 60% → 40% → 30% → 25%')
    expect(formatPct(data.funnelSummary.endToEnd)).toBe('1.8%')
  })

  it('keeps funnelOption a thin range-aware layer (no series override)', () => {
    const data = useDashboardData('30d')
    expect('series' in data.funnelOption).toBe(false)
    expect('xAxis' in data.funnelOption).toBe(false)
    expect('yAxis' in data.funnelOption).toBe(false)
    expect(data.funnelOption.aria.label.description).toContain('Last 30 days')
    expect(data.funnelOption.aria.label.description).toContain('End-to-end 1.8% retained.')
    expect(useDashboardData('ytd').funnelOption.aria.label.description).toContain('Year to date')
  })
})
