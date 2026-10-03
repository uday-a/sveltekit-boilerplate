// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { Session, SessionUser } from './lib/server/guards'

declare global {
  namespace App {
    // interface Error {}
    interface Locals {
      // Full session (user + loggedInAt + demo flag). Set by
      // hooks.server.ts from the sealed `sk-session` cookie on every
      // request; null when logged out. Guards read this.
      // CONTRACT: session.user.id is the DB users.id primary key (not
      // the GitHub numeric id) — see guards.ts.
      session: Session | null
      // Current signed-in user (null when logged out). Page workers:
      // read this in load functions; client components read `data.user`
      // (see src/routes/+layout.server.ts).
      user: SessionUser | null
      // True for demo-mode sessions (POST /auth/demo). Demo users look
      // like admins in the UI but have no DB row (id 0).
      demo: boolean
    }
    interface PageData {
      user?: SessionUser | null
      demo?: boolean
    }
    // interface PageState {}
    // interface Platform {}
  }
}

export {}
