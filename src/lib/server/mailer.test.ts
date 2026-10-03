import { describe, expect, it } from 'vitest'
import { feedbackEmail, magicLinkEmail, sendEmail, shell, welcomeEmail } from './mailer'

// RESEND_API_KEY is unset in the test env (see vitest.config.ts — only
// SESSION_PASSWORD is provided), so every send takes the dry-run path:
// consola-printed, nothing sent, { id: null }.
describe('sendEmail dry-run', () => {
  it('returns { id: null } without throwing when unconfigured', async () => {
    await expect(sendEmail({
      to: 'dev@example.com',
      subject: 'dry run',
      html: '<p>hi</p>'
    })).resolves.toEqual({ id: null })
  })
})

describe('shell', () => {
  it('wraps the body in a standalone HTML document', () => {
    const html = shell('Hello', '<p>body</p>')
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('<title>Hello</title>')
    expect(html).toContain('<p>body</p>')
  })
})

describe('templates', () => {
  it('welcomeEmail targets the new user with a dashboard link', () => {
    const email = welcomeEmail({ name: 'Ada', email: 'ada@example.com', siteUrl: 'http://localhost:5173' })
    expect(email.to).toBe('ada@example.com')
    expect(email.subject).toContain('Welcome')
    expect(email.html).toContain('http://localhost:5173/dashboard')
    expect(email.text).toContain('Ada')
    expect(email.tags).toContainEqual({ name: 'kind', value: 'welcome' })
  })

  it('magicLinkEmail embeds the single-use link and TTL', () => {
    const email = magicLinkEmail({ email: 'ada@example.com', link: 'https://x.test/auth/magic-link?token=abc', expiresInMin: 15 })
    expect(email.to).toBe('ada@example.com')
    expect(email.subject).toContain('Sign in')
    expect(email.html).toContain('token=abc')
    expect(email.text).toContain('15 minutes')
    expect(email.tags).toContainEqual({ name: 'kind', value: 'magic-link' })
  })

  it('feedbackEmail routes to ops with reporter context and escaped body', () => {
    const email = feedbackEmail({
      to: 'ops@example.com',
      reporter: { name: 'Ada', email: 'ada@example.com', login: 'ada' },
      category: 'bug',
      subject: 'Broken thing',
      message: '<script>alert(1)</script> details here'
    })
    expect(email.to).toBe('ops@example.com')
    expect(email.subject).toBe('[Feedback · bug] Broken thing')
    expect(email.replyTo).toBe('ada@example.com')
    expect(email.html).not.toContain('<script>')
    expect(email.html).toContain('&lt;script&gt;')
    expect(email.tags).toContainEqual({ name: 'kind', value: 'feedback' })
    expect(email.tags).toContainEqual({ name: 'category', value: 'bug' })
  })

  it('feedback dry-run delivers through sendEmail as { id: null }', async () => {
    const email = feedbackEmail({
      to: 'ops@example.com',
      reporter: { name: 'Ada', email: 'ada@example.com', login: 'ada' },
      category: 'idea',
      subject: 'An idea',
      message: 'a sufficiently long message body for the test'
    })
    await expect(sendEmail(email)).resolves.toEqual({ id: null })
  })
})
