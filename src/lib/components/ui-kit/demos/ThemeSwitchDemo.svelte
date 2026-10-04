<script lang="ts">
  import { ThemeSwitch } from '$lib/components/ui/theme-switch'
</script>

<div class="space-y-4">
  <ThemeSwitch value="light" variant="cards" />
  <div class="flex flex-wrap items-center gap-4">
    <ThemeSwitch value="dark" variant="icons" />
    <ThemeSwitch value="system" variant="pill" />
  </div>
</div>
