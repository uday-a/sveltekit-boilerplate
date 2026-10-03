import { describe, expect, it } from 'vitest'
import {
  ROLES,
  magicLinkTokens,
  projects,
  projectsRelations,
  subscriptions,
  subscriptionsRelations,
  userRole,
  users,
  usersRelations
} from './schema'

// Import-only: the schema must load without a live DB, export the full
// table surface the routes rely on, and expose the relations map.
describe('schema', () => {
  it('exports the user_role enum with exactly user|admin|editor', () => {
    expect(userRole.enumValues).toEqual(['user', 'admin', 'editor'])
    expect(ROLES).toEqual(['user', 'admin', 'editor'])
  })

  it('exports all four tables', () => {
    for (const table of [users, projects, subscriptions, magicLinkTokens]) {
      expect(table).toBeDefined()
    }
  })

  it('exposes the columns the API routes select on', () => {
    expect(users.id).toBeDefined()
    expect(users.email).toBeDefined()
    expect(users.githubId).toBeDefined()
    expect(users.login).toBeDefined()
    expect(users.name).toBeDefined()
    expect(users.avatarUrl).toBeDefined()
    expect(users.role).toBeDefined()
    expect(users.bio).toBeDefined()
    expect(users.timezone).toBeDefined()
    expect(users.locale).toBeDefined()
    expect(users.notifyEmail).toBeDefined()
    expect(users.notifyInApp).toBeDefined()

    expect(projects.slug).toBeDefined()
    expect(projects.ownerId).toBeDefined()

    expect(subscriptions.userId).toBeDefined()
    expect(subscriptions.polarCustomerId).toBeDefined()
    expect(subscriptions.polarSubscriptionId).toBeDefined()
    expect(subscriptions.productId).toBeDefined()
    expect(subscriptions.status).toBeDefined()

    expect(magicLinkTokens.tokenHash).toBeDefined()
    expect(magicLinkTokens.expiresAt).toBeDefined()
    expect(magicLinkTokens.usedAt).toBeDefined()
  })

  it('exports the relations map for the relational query builder', () => {
    expect(usersRelations).toBeDefined()
    expect(projectsRelations).toBeDefined()
    expect(subscriptionsRelations).toBeDefined()
  })
})
