import { afterEach, describe, expect, it } from 'vitest'
import { env } from './env'
import { getPolar, planForProductId, productIdForPlan } from './polar'

// Plan mapping reads env at call time, so tests can slot product IDs in
// and restore afterwards. POLAR_* is unset in the test env otherwise.
const saved = {
  pro: env.POLAR_PRO_PRODUCT_ID,
  team: env.POLAR_TEAM_PRODUCT_ID,
  enterprise: env.POLAR_ENTERPRISE_PRODUCT_ID
}

afterEach(() => {
  env.POLAR_PRO_PRODUCT_ID = saved.pro
  env.POLAR_TEAM_PRODUCT_ID = saved.team
  env.POLAR_ENTERPRISE_PRODUCT_ID = saved.enterprise
})

describe('productIdForPlan / planForProductId', () => {
  it('returns null for every plan when no product IDs are configured', () => {
    expect(productIdForPlan('pro')).toBeNull()
    expect(productIdForPlan('team')).toBeNull()
    expect(productIdForPlan('enterprise')).toBeNull()
    expect(planForProductId('prod_unknown')).toBeNull()
  })

  it('round-trips plan <-> product ID once slots are configured', () => {
    env.POLAR_PRO_PRODUCT_ID = 'prod_pro_123'
    env.POLAR_TEAM_PRODUCT_ID = 'prod_team_456'
    env.POLAR_ENTERPRISE_PRODUCT_ID = 'prod_ent_789'

    expect(productIdForPlan('pro')).toBe('prod_pro_123')
    expect(productIdForPlan('team')).toBe('prod_team_456')
    expect(productIdForPlan('enterprise')).toBe('prod_ent_789')

    expect(planForProductId('prod_pro_123')).toBe('pro')
    expect(planForProductId('prod_team_456')).toBe('team')
    expect(planForProductId('prod_ent_789')).toBe('enterprise')
  })

  it('returns null for product IDs outside the tier ladder', () => {
    env.POLAR_PRO_PRODUCT_ID = 'prod_pro_123'
    expect(planForProductId('prod_one_off_invoice')).toBeNull()
  })
})

describe('getPolar', () => {
  it('returns null when Polar is not configured (no SDK import, no network)', async () => {
    await expect(getPolar()).resolves.toBeNull()
  })
})
