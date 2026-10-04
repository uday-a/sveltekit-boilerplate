<script lang="ts">
  import { FileUpload, FileUploadContent, FileUploadItem } from '$lib/components/ui/file-upload'

  let files = $state<File[]>([])
</script>

<FileUpload bind:modelValue={files} accept="image/*" multiple>
  {#snippet content()}
    {#if files.length}
      <FileUploadContent>
        {#each files as f, i (`${f.name}-${f.size}`)}
          <FileUploadItem file={f} onRemove={() => (files = files.filter((_, idx) => idx !== i))} />
        {/each}
      </FileUploadContent>
    {/if}
  {/snippet}
</FileUpload>
