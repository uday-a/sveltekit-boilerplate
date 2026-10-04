import { usage } from '$lib/data/ui-catalog/usage.server'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = () => ({ usage })
