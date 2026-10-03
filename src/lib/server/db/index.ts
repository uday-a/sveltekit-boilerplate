import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { env } from '../env'
import * as schema from './schema'

// Lazy singleton so dev HMR doesn't open new pools on every reload.
let _db: ReturnType<typeof drizzle> | null = null

export type Database = ReturnType<typeof drizzle>

export function useDb(): Database {
  if (_db) return _db
  if (!env.DATABASE_URL) throw new Error('DATABASE_URL is not set')
  const client = postgres(env.DATABASE_URL, { prepare: false })
  _db = drizzle(client, { schema })
  return _db
}

export { schema }
