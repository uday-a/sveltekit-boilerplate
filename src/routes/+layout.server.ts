import type { LayoutServerLoad } from './$types'

// Root layout load — the `useUserSession()` equivalent for SvelteKit.
// Exposes the session to every page as `data.user` / `data.demo`:
//
//   <script lang="ts">
//     let { data } = $props()
//     {#if data.user}Hello {data.user.name}{/if}
//   </script>
//
// Server load functions that need hard guarantees (not just display)
// should still read event.locals directly and redirect/throw —
// data.user is display state, locals.user is the auth source of truth.
export const load: LayoutServerLoad = async ({ locals }) => {
  return {
    user: locals.user,
    demo: locals.demo,
  }
}
