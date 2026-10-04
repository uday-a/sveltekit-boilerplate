<script lang="ts">
  import { FolderOpen } from '@lucide/svelte'
  import { Button } from '$lib/components/ui/button'
  import { EmptyState } from '$lib/components/ui/empty-state'
</script>

<EmptyState
  icon={FolderOpen}
  title="No projects yet"
  description="Create a project to start tracking deploys and usage."
  headingTag="h4"
  class="py-4"
>
  <Button size="sm" class="mt-4">New project</Button>
</EmptyState>
