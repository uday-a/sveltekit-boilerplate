<!-- 4-quadrant uipkge logo. Sits next to Lucide icons in the teams array. -->
<script lang="ts" module>
  export interface UipkgeMarkProps {
    class?: string
  }
</script>

<script lang="ts">
  let { class: className }: UipkgeMarkProps = $props()
</script>

<svg viewBox="0 0 24 24" class={className} fill="currentColor" aria-hidden="true">
  <rect x="2" y="2" width="9" height="9" rx="1.5" />
  <rect x="13" y="2" width="9" height="9" rx="1.5" opacity="0.55" />
  <rect x="2" y="13" width="9" height="9" rx="1.5" opacity="0.55" />
  <rect x="13" y="13" width="9" height="9" rx="1.5" />
</svg>
