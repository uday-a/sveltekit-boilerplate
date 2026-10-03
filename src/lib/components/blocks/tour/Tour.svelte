<script lang="ts" module>
  import type { TourTarget } from './use-tour-target.svelte'

  export interface TourStep {
    target?: TourTarget
    title: string
    description?: string
    cover?: string
    mask?: boolean
    nextButtonText?: string
    prevButtonText?: string
    finishButtonText?: string
    /** Optional link button shown in the card, e.g. "Star on GitHub". */
    action?: { label: string, href: string }
  }

  export interface TourProps {
    /** Controlled open state (`bind:open`). */
    open?: boolean
    /** Controlled step index (`bind:current`). */
    current?: number
    steps: TourStep[]
    mask?: boolean
    type?: 'default' | 'primary'
    zIndex?: number
    onOpenChange?: (open: boolean) => void
    onCurrentChange?: (current: number) => void
    onchange?: (current: number) => void
    onfinish?: () => void
    onclose?: () => void
  }
</script>

<script lang="ts">
  import { tick } from 'svelte'
  import { browser } from '$app/environment'
  import TourCard from './TourCard.svelte'
  import TourMask from './TourMask.svelte'
  import { useTourTarget } from './use-tour-target.svelte'

  let {
    open = $bindable(false),
    current = $bindable(0),
    steps,
    mask = true,
    type = 'default',
    zIndex = 1000,
    onOpenChange,
    onCurrentChange,
    onchange,
    onfinish,
    onclose,
  }: TourProps = $props()

  const stepIndex = $derived(current)
  const currentStep = $derived<TourStep | null>(steps[stepIndex] ?? null)

  const target = useTourTarget(() => currentStep?.target)

  /** Element that held focus before the tour opened — restored on close. */
  let previousFocus: HTMLElement | null = null
  let wasOpen = $state(false)

  function setStep(i: number) {
    current = i
    onCurrentChange?.(i)
    onchange?.(i)
  }

  function next() {
    if (stepIndex < steps.length - 1) setStep(stepIndex + 1)
  }

  function prev() {
    if (stepIndex > 0) setStep(stepIndex - 1)
  }

  function finish() {
    onfinish?.()
    open = false
    onOpenChange?.(false)
  }

  function skip() {
    onclose?.()
    open = false
    onOpenChange?.(false)
  }

  function onKeydown(e: KeyboardEvent) {
    if (!open) return
    if (e.key === 'Escape') {
      e.preventDefault()
      skip()
    }
  }

  // Open/close + step transitions. SSR-safe: everything inside runs only in
  // the browser (`browser` from `$app/environment`) — SSR renders nothing.
  $effect(() => {
    if (!browser) return
    if (!open) {
      target.detach()
      if (wasOpen) {
        previousFocus?.focus?.()
        previousFocus = null
      }
      wasOpen = false
      document.removeEventListener('keydown', onKeydown)
      return
    }
    if (!wasOpen) previousFocus = (document.activeElement as HTMLElement | null) ?? null
    wasOpen = true
    document.addEventListener('keydown', onKeydown)
    tick().then(() => {
      target.attach()
      const t = currentStep?.target
      const el
        = typeof t === 'string'
          ? (document.querySelector(t) as HTMLElement | null)
          : typeof t === 'function'
            ? t()
            : (t as HTMLElement | null)
      const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
      el?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
      setTimeout(target.measure, reduce ? 0 : 320)
    })
    return () => {
      document.removeEventListener('keydown', onKeydown)
    }
  })

  // Re-attach when the step changes while open.
  $effect(() => {
    if (!browser || !open) return
    void stepIndex
    tick().then(() => {
      target.attach()
      setTimeout(target.measure, 320)
    })
  })

  const showMask = $derived.by(() => {
    const stepMask = currentStep?.mask
    if (stepMask !== undefined) return stepMask
    return mask
  })
</script>

{#if browser && open && currentStep}
  {#if showMask}
    <TourMask rect={target.rect} zIndex={zIndex} />
  {/if}
  <TourCard
    title={currentStep.title}
    description={currentStep.description}
    cover={currentStep.cover}
    action={currentStep.action}
    rect={target.rect}
    total={steps.length}
    current={stepIndex}
    prevText={currentStep.prevButtonText}
    nextText={currentStep.nextButtonText}
    finishText={currentStep.finishButtonText}
    {type}
    zIndex={zIndex}
    autofocus
    onprev={prev}
    onnext={next}
    onfinish={finish}
    onskip={skip}
  />
{/if}
