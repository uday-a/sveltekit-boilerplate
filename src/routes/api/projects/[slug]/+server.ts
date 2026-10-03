import type { RequestHandler } from './$types'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDb } from '$lib/server/db/index'
import { requireAuth } from '$lib/server/guards'
import { logger } from '$lib/server/logger'
import { apiError, jsonError, jsonOk } from '$lib/server/response'

// Single project resource: GET, PUT, DELETE. Port of nuxt-boilerplate
// server/api/projects/[slug].ts (method-branched there; SvelteKit
// exports one handler per method here — same paths).

const UpdateProject = z.object({
  name: z.string().trim().min(1).max(128).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
})

export const GET: RequestHandler = async (event) => {
  try {
    const session = await requireAuth(event)
    const slug = event.params.slug
    if (!slug) throw apiError('VALIDATION_FAILED', 'Missing slug')

    if (session.demo === true) {
      const demo = demoBySlug(slug)
      if (!demo) throw apiError('NOT_FOUND', `Project ${slug} does not exist`)
      return jsonOk({ project: demo })
    }

    const db = useDb()
    const [project] = await db
      .select()
      .from(schema.projects)
      .where(and(eq(schema.projects.slug, slug), eq(schema.projects.ownerId, session.user.id)))
      .limit(1)
    if (!project) throw apiError('NOT_FOUND', `Project ${slug} does not exist`)
    return jsonOk({ project })
  }
  catch (err) {
    return jsonError(err)
  }
}

export const PUT: RequestHandler = async (event) => {
  try {
    const session = await requireAuth(event)
    const slug = event.params.slug
    if (!slug) throw apiError('VALIDATION_FAILED', 'Missing slug')

    const parsed = UpdateProject.safeParse(await event.request.json())
    if (!parsed.success) {
      throw apiError('VALIDATION_FAILED', 'Invalid project payload', {
        issues: parsed.error.issues,
      })
    }

    if (session.demo === true) {
      const demo = demoBySlug(slug)
      if (!demo) throw apiError('NOT_FOUND', `Project ${slug} does not exist`)
      return jsonOk({ project: { ...demo, ...parsed.data, updatedAt: new Date() } })
    }

    const db = useDb()
    const [project] = await db
      .update(schema.projects)
      .set({ ...parsed.data, updatedAt: new Date() })
      .where(and(eq(schema.projects.slug, slug), eq(schema.projects.ownerId, session.user.id)))
      .returning()
    if (!project) throw apiError('NOT_FOUND', `Project ${slug} does not exist`)
    logger.info('projects.updated', { ownerId: session.user.id, slug })
    return jsonOk({ project })
  }
  catch (err) {
    return jsonError(err)
  }
}

export const DELETE: RequestHandler = async (event) => {
  try {
    const session = await requireAuth(event)
    const slug = event.params.slug
    if (!slug) throw apiError('VALIDATION_FAILED', 'Missing slug')

    if (session.demo === true) return jsonOk({ deleted: true })

    const db = useDb()
    const [project] = await db
      .delete(schema.projects)
      .where(and(eq(schema.projects.slug, slug), eq(schema.projects.ownerId, session.user.id)))
      .returning({ id: schema.projects.id })
    if (!project) throw apiError('NOT_FOUND', `Project ${slug} does not exist`)
    logger.info('projects.deleted', { ownerId: session.user.id, slug })
    return jsonOk({ deleted: true })
  }
  catch (err) {
    return jsonError(err)
  }
}

function demoBySlug(slug: string) {
  const demos = [
    { id: 1, slug: 'design-engineering', name: 'Design Engineering', description: 'Frontend platform, design system, UX research.', ownerId: 0, createdAt: new Date('2026-01-12'), updatedAt: new Date('2026-04-30') },
    { id: 2, slug: 'sales-marketing', name: 'Sales & Marketing', description: 'GTM ops, campaigns, pipeline analytics.', ownerId: 0, createdAt: new Date('2026-02-04'), updatedAt: new Date('2026-05-12') },
    { id: 3, slug: 'travel', name: 'Travel', description: 'Trip planning, expense tracking, traveler ops.', ownerId: 0, createdAt: new Date('2026-03-19'), updatedAt: new Date('2026-05-15') },
  ]
  return demos.find(d => d.slug === slug)
}
