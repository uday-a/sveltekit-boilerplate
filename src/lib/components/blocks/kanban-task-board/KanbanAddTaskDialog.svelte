<script lang="ts">
  import type { KanbanTask, KanbanColumn } from '$lib/composables/useKanban'
  import { priorityConfig, assignees, tagPresets } from '$lib/composables/useKanban'
  import {
    Dialog,
    DialogScrollContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
  } from '$lib/components/ui/dialog'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
  import { Calendar } from '$lib/components/ui/calendar'
  import { RichTextEditor } from '$lib/components/ui/rich-text-editor'
  import { Plus, X, CheckCircle2, Calendar as CalendarIcon } from '@lucide/svelte'
  import { getLocalTimeZone, DateFormatter, type DateValue } from '@internationalized/date'

  interface KanbanAddTaskDialogProps {
    open?: boolean
    columns: KanbanColumn[]
    initialColumnId: string
    onCreate?: (columnId: string, tasks: KanbanTask[]) => void
  }

  let { open = $bindable(false), columns, initialColumnId, onCreate }: KanbanAddTaskDialogProps = $props()

  const df = new DateFormatter('en-US', { dateStyle: 'medium' })

  let columnId = $state(initialColumnId)
  let dueDate = $state<DateValue | undefined>(undefined)
  let form = $state({
    title: '',
    description: '',
    priority: 'medium' as KanbanTask['priority'],
    assigneeKey: 'alice' as keyof typeof assignees,
    tagKeys: [] as (keyof typeof tagPresets)[],
    subtaskTexts: [] as string[],
  })
  let newSubtaskText = $state('')

  function resetForm() {
    columnId = initialColumnId
    form = {
      title: '',
      description: '',
      priority: 'medium',
      assigneeKey: 'alice',
      tagKeys: [],
      subtaskTexts: [],
    }
    dueDate = undefined
    newSubtaskText = ''
  }

  // Reset the draft whenever the dialog opens (and track late column changes).
  $effect(() => {
    if (open) resetForm()
  })

  function addSubtask() {
    const text = newSubtaskText.trim()
    if (!text) return
    form.subtaskTexts.push(text)
    newSubtaskText = ''
  }

  function removeSubtask(index: number) {
    form.subtaskTexts.splice(index, 1)
  }

  function toggleTag(key: keyof typeof tagPresets) {
    const idx = form.tagKeys.indexOf(key)
    if (idx >= 0) form.tagKeys.splice(idx, 1)
    else form.tagKeys.push(key)
  }

  function submit() {
    if (!form.title.trim()) return
    const maxId = columns
      .flatMap((c) => c.tasks)
      .reduce((max, t) => {
        const num = parseInt(t.id.replace(/^[A-Z]+-/, ''), 10)
        return num > max ? num : max
      }, 0)
    const idPrefix = columns.flatMap((c) => c.tasks)[0]?.id.split('-')[0] ?? 'TASK'
    const parentId = `${idPrefix}-${maxId + 1}`
    const subtaskTasks: KanbanTask[] = form.subtaskTexts.map((text, i) => ({
      id: `${idPrefix}-${maxId + 2 + i}`,
      title: text,
      priority: 'medium' as const,
      assignee: assignees[form.assigneeKey],
      tags: [],
      parentId,
      subtaskIds: [],
      commentItems: [],
      fileItems: [],
    }))
    const newTask: KanbanTask = {
      id: parentId,
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      priority: form.priority,
      assignee: assignees[form.assigneeKey],
      tags: form.tagKeys.map((k) => tagPresets[k]),
      dueDate: dueDate ? dueDate.toString() : undefined,
      subtaskIds: subtaskTasks.map((t) => t.id),
      commentItems: [],
      fileItems: [],
    }
    onCreate?.(columnId, [newTask, ...subtaskTasks])
    open = false
  }
</script>

<Dialog bind:open>
  <DialogScrollContent data-slot="kanban-board" class="max-w-[680px] sm:max-w-full">
    <DialogHeader>
      <DialogTitle>New Task</DialogTitle>
      <DialogDescription>
        Adding task to
        {columns.find((c) => c.id === columnId)?.title ?? 'column'}
      </DialogDescription>
    </DialogHeader>

    <div class="grid gap-4 py-2">
      <div class="grid gap-1.5">
        <Label for="task-title">Title</Label>
        <Input id="task-title" bind:value={form.title} placeholder="Enter task title" />
      </div>

      <div class="grid gap-1.5">
        <Label>
          Description
          <span class="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <RichTextEditor bind:value={form.description} />
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div class="grid gap-1.5">
          <Label for="task-priority">Priority</Label>
          <Select value={form.priority} onValueChange={(v) => (form.priority = v as KanbanTask['priority'])}>
            <SelectTrigger id="task-priority">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              {#each Object.entries(priorityConfig) as [key, config] (key)}
                <SelectItem value={key}>
                  {config.label}
                </SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>

        <div class="grid gap-1.5">
          <Label for="task-assignee">Assignee</Label>
          <Select
            value={form.assigneeKey}
            onValueChange={(v) => (form.assigneeKey = v as keyof typeof assignees)}
          >
            <SelectTrigger id="task-assignee">
              <SelectValue placeholder="Assignee" />
            </SelectTrigger>
            <SelectContent>
              {#each Object.entries(assignees) as [key, person] (key)}
                <SelectItem value={key}>
                  {person.name}
                </SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>

        <div class="grid gap-1.5">
          <Label for="task-column">Column</Label>
          <Select bind:value={columnId}>
            <SelectTrigger id="task-column">
              <SelectValue placeholder="Column" />
            </SelectTrigger>
            <SelectContent>
              {#each columns as col (col.id)}
                <SelectItem value={col.id}>
                  {col.title}
                </SelectItem>
              {/each}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div class="grid gap-1.5">
        <Label>
          Due Date
          <span class="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Popover>
          <PopoverTrigger>
            {#snippet child({ props })}
              <Button
                variant="outline"
                {...props}
                class={['w-full justify-start text-left font-normal', !dueDate && 'text-muted-foreground']}
              >
                <CalendarIcon class="mr-2 size-4" />
                {dueDate ? df.format(dueDate.toDate(getLocalTimeZone())) : 'Pick a date'}
              </Button>
            {/snippet}
          </PopoverTrigger>
          <PopoverContent class="w-auto p-0">
            <Calendar bind:value={dueDate} />
          </PopoverContent>
        </Popover>
      </div>

      <div class="grid gap-1.5">
        <Label>
          Tags
          <span class="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <div class="flex flex-wrap gap-2">
          {#each Object.entries(tagPresets) as [key, tag] (key)}
            {@const tagKey = key as keyof typeof tagPresets}
            {@const selected = form.tagKeys.includes(tagKey)}
            <button
              type="button"
              class={[
                'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
                selected
                  ? 'bg-primary text-primary-foreground border-transparent'
                  : 'border-border bg-background text-foreground hover:bg-muted',
              ]}
              onclick={() => toggleTag(tagKey)}
            >
              {#if selected}
                <CheckCircle2 class="size-3" />
              {/if}
              {tag.label}
            </button>
          {/each}
        </div>
      </div>

      <div class="grid gap-1.5">
        <Label>
          Subtasks
          <span class="text-muted-foreground text-xs">(optional)</span>
        </Label>
        {#if form.subtaskTexts.length}
          <div class="space-y-2">
            {#each form.subtaskTexts as text, index (index)}
              <div class="flex items-center gap-2">
                <span class="flex-1 text-sm">{text}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  class="size-6"
                  aria-label="Remove subtask"
                  onclick={() => removeSubtask(index)}
                >
                  <X class="size-3" />
                </Button>
              </div>
            {/each}
          </div>
        {/if}
        <div class="flex items-center gap-2">
          <Input
            bind:value={newSubtaskText}
            placeholder="Add a subtask"
            onkeydown={(e) => {
              if (e.key === 'Enter') addSubtask()
            }}
          />
          <Button variant="outline" size="icon" aria-label="Add subtask" onclick={addSubtask}>
            <Plus class="size-4" />
          </Button>
        </div>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" onclick={() => (open = false)}>Cancel</Button>
      <Button disabled={!form.title.trim()} onclick={submit}>Create Task</Button>
    </DialogFooter>
  </DialogScrollContent>
</Dialog>
