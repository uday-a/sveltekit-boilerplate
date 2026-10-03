import type { RequestHandler } from './$types'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { schema, useDb } from '$lib/server/db/index'
import { requireAuth } from '$lib/server/guards'
import { logger } from '$lib/server/logger'
import { apiError, jsonError, jsonOk } from '$lib/server/response'

// Projects collection: GET lists the caller's, POST creates one. Port of
// nuxt-boilerplate server/api/projects/index.ts (method-branched there;
// SvelteKit exports one handler per method here — same paths).

const slug = z
  .string()
  .trim()
  .min(2, 'Slug must be at least 2 characters')
  .max(64, 'Slug must be 64 characters or fewer')
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, 'Slug must be kebab-case (a-z, 0-9, hyphen)')

const CreateProject = z.object({
  slug,
  name: z.string().trim().min(1).max(128),
  description: z.string().trim().max(2000).optional(),
})

export const GET: RequestHandler = async (event) => {
  try {
    const session = await requireAuth(event)

    // Demo session has no DB row; surface a deterministic list so the UI
    // is clickable without polluting real data. Production
    // (DEMO_MODE=false) takes the normal path.
    if (session.demo === true) return jsonOk({ projects: demoProjects() })

    const db = useDb()
    const rows = await db
      .select()
      .from(schema.projects)
      .where(eq(schema.projects.ownerId, session.user.id))
      .orderBy(schema.projects.createdAt)
    return jsonOk({ projects: rows })
  }
  catch (err) {
    return jsonError(err)
  }
}

export const POST: RequestHandler = async (event) => {
  try {
    const session = await requireAuth(event)

    const parsed = CreateProject.safeParse(await event.request.json())
    if (!parsed.success) {
      throw apiError('VALIDATION_FAILED', 'Invalid project payload', {
        issues: parsed.error.issues,
      })
    }

    if (session.demo === true) {
      // Demo: echo back without persisting.
      return jsonOk({
        project: {
          id: 0,
          ownerId: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
          description: null,
          ...parsed.data,
        },
      })
    }

    const db = useDb()
    try {
      const [project] = await db
        .insert(schema.projects)
        .values({
          slug: parsed.data.slug,
          name: parsed.data.name,
          description: parsed.data.description ?? null,
          ownerId: session.user.id,
        })
        .returning()
      logger.info('projects.created', { ownerId: session.user.id, slug: parsed.data.slug })
      return jsonOk({ project })
    }
    catch (e) {
      // Drizzle + postgres-js bubble pg's unique_violation as code '23505'.
      if ((e as { code?: string }).code === '23505') {
        throw apiError('VALIDATION_FAILED', `A project with slug '${parsed.data.slug}' already exists`, { field: 'slug' })
      }
      throw e
    }
  }
  catch (err) {
    return jsonError(err)
  }
}

// Deterministic demo data so the UI looks populated in demo mode.
function demoProjects() {
  return [
    { id: 1, slug: 'design-engineering', name: 'Design Engineering', description: 'Frontend platform, design system, UX research.', ownerId: 0, createdAt: new Date('2026-01-12'), updatedAt: new Date('2026-04-30') },
    { id: 2, slug: 'sales-marketing', name: 'Sales & Marketing', description: 'GTM ops, campaigns, pipeline analytics.', ownerId: 0, createdAt: new Date('2026-02-04'), updatedAt: new Date('2026-05-12') },
    { id: 3, slug: 'travel', name: 'Travel', description: 'Trip planning, expense tracking, traveler ops.', ownerId: 0, createdAt: new Date('2026-03-19'), updatedAt: new Date('2026-05-15') },
  ]
}
