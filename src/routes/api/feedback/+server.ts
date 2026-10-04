import type { RequestHandler } from './$types'
import { z } from 'zod'
import { env } from '$lib/server/env'
import { requireAuth } from '$lib/server/guards'
import { feedbackEmail, sendEmail, type EmailAttachment } from '$lib/server/mailer'
import { apiError, jsonError, jsonOk } from '$lib/server/response'

const FeedbackInput = z.object({
  category: z.enum(['bug', 'idea', 'praise']),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(120, 'Subject must be 120 characters or fewer'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(4000, 'Message must be 4000 characters or fewer'),
})

// Attachments are screenshots, so images only. Client validates first;
// the server re-checks every file because client checks are bypassable.
const MAX_FILES = 3
const MAX_FILE_BYTES = 5 * 1024 * 1024

export const POST: RequestHandler = async (event) => {
  try {
    const session = await requireAuth(event)

    // Demo sessions are minted by anyone on demand; don't let them relay
    // email through our sender.
    if (session.demo === true) {
      throw apiError('FORBIDDEN', 'Feedback is disabled in demo mode.')
    }

    let input: Record<string, unknown> = {}
    let attachments: EmailAttachment[] = []

    const contentType = event.request.headers.get('content-type') ?? ''
    if (contentType.includes('multipart/form-data')) {
      const form = await event.request.formData().catch(() => null)
      if (!form) throw apiError('VALIDATION_FAILED', 'Invalid feedback payload')
      input = { category: form.get('category'), subject: form.get('subject'), message: form.get('message') }

      const files = form.getAll('files').filter((f): f is File => f instanceof File)
      if (files.length > MAX_FILES) {
        throw apiError('VALIDATION_FAILED', `You can attach up to ${MAX_FILES} images`)
      }
      attachments = await Promise.all(files.map(async (f) => {
        const filename = f.name || 'attachment'
        if (!f.type.startsWith('image/')) throw apiError('VALIDATION_FAILED', `${filename} is not an image`)
        if (f.size > MAX_FILE_BYTES) throw apiError('VALIDATION_FAILED', `${filename} is larger than 5 MB`)
        return {
          filename,
          content: Buffer.from(await f.arrayBuffer()).toString('base64'),
          contentType: f.type,
        }
      }))
    }
    else {
      input = (await event.request.json().catch(() => ({}))) ?? {}
    }

    const parsed = FeedbackInput.safeParse(input)
    if (!parsed.success) {
      throw apiError('VALIDATION_FAILED', 'Invalid feedback payload', {
        issues: parsed.error.issues,
      })
    }

    // Where to deliver: EMAIL_OPS if set, otherwise EMAIL_FROM so an
    // unconfigured prod doesn't accidentally ship feedback to a random
    // address. Both surfaces print to consola in dev (no Resend key).
    const to = env.EMAIL_OPS ?? env.EMAIL_FROM

    const { id } = await sendEmail(feedbackEmail({
      to,
      reporter: {
        name: session.user.name ?? session.user.login,
        email: session.user.email ?? `${session.user.login}@github.invalid`,
        login: session.user.login,
      },
      category: parsed.data.category,
      subject: parsed.data.subject,
      message: parsed.data.message,
      ...(attachments.length ? { attachments } : {}),
    }))

    return jsonOk({ delivered: Boolean(id) || !env.RESEND_API_KEY, id })
  }
  catch (err) {
    return jsonError(err)
  }
}
