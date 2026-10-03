<script lang="ts">
  import { onMount } from 'svelte'
  import {
    AlertCircle,
    Check,
    Copy,
    CreditCard,
    Fingerprint,
    Hash,
    Home,
    Loader2,
    Mail,
    MapPin,
    Moon,
    Palette,
    Search,
    Settings,
    Sun,
    User,
    X,
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Link as LinkIcon,
    Image as ImageIcon,
  } from '@lucide/svelte'
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from '$lib/components/ui/card'
  import { Badge } from '$lib/components/ui/badge'
  import { Button } from '$lib/components/ui/button'
  import { Input } from '$lib/components/ui/input'
  import { Label } from '$lib/components/ui/label'
  import { Textarea } from '$lib/components/ui/textarea'
  import { Checkbox } from '$lib/components/ui/checkbox'
  import { Switch } from '$lib/components/ui/switch'
  import { RadioGroup, RadioGroupItem } from '$lib/components/ui/radio-group'
  import { Slider } from '$lib/components/ui/slider'
  import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '$lib/components/ui/select'
  import { Separator } from '$lib/components/ui/separator'
  import { Progress } from '$lib/components/ui/progress'
  import { Skeleton } from '$lib/components/ui/skeleton'
  import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
  } from '$lib/components/ui/breadcrumb'
  import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '$lib/components/ui/accordion'
  import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '$lib/components/ui/collapsible'
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from '$lib/components/ui/dialog'
  import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from '$lib/components/ui/sheet'
  import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover'
  import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '$lib/components/ui/tooltip'
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
  } from '$lib/components/ui/dropdown-menu'
  import { Toggle } from '$lib/components/ui/toggle'
  import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group'
  import { PinInput, PinInputGroup, PinInputSeparator, PinInputSlot } from '$lib/components/ui/pin-input'
  import { KpiGrid } from '$lib/components/ui/kpi-grid'
  import StatTile from '$lib/components/blocks/stat-tile/StatTile.svelte'
  import { Page, PageHeader, PageHeaderHeading } from '$lib/components/ui/page'
  import { DataList, DataListItem } from '$lib/components/ui/data-list'
  import { SectionCard } from '$lib/components/ui/section-card'
  import { IconBox } from '$lib/components/ui/icon-box'
  import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
  } from '$lib/components/ui/command'
  import { ThemeSwitch } from '$lib/components/ui/theme-switch'
  import { Avatar, AvatarFallback } from '$lib/components/ui/avatar'
  import { RichTextEditor } from '$lib/components/ui/rich-text-editor'
  import { OverlayScroll } from '$lib/components/ui/overlay-scroll'

  // Port of nuxt `app/pages/dashboard/ui-kit.vue` — gallery rendering every
  // copied ui primitive. (Loader2/Moon/Sun/MapPin/Check/X/CreditCard/etc are
  // referenced across the sections below; keep imports in sync.)

  let otpValue = $state<string[]>([])
  let dialogOpen = $state(false)
  let sheetOpen = $state(false)
  let sliderValue = $state<number[]>([65])
  let loadingDemo = $state(true)

  onMount(() => {
    const t = setTimeout(() => (loadingDemo = false), 2000)
    return () => clearTimeout(t)
  })

  const kpiItems = [
    { label: 'Total Revenue', value: '$84,230', change: '+12.5%' },
    { label: 'Active Users', value: '2,420', change: '+8.2%' },
    { label: 'Conversion Rate', value: '3.24%', change: '-0.4%' },
    { label: 'Avg. Order Value', value: '$64.50', change: '+2.1%' },
  ]
</script>

<svelte:head>
  <title>UI Kit | UIPKGE</title>
</svelte:head>

<Page>
  <PageHeader>
    <PageHeaderHeading title="UI Kit" description="Every primitive demonstrated in realistic contexts." />
  </PageHeader>

  <!-- Breadcrumb variants -->
  <Card>
    <CardHeader>
      <CardTitle class="text-base">Breadcrumb</CardTitle>
      <CardDescription>Navigation hierarchy with links and current page.</CardDescription>
    </CardHeader>
    <CardContent>
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">
              <Home class="size-3.5" />
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>UI Kit</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </CardContent>
  </Card>

  <!-- KPI Grid -->
  <Card>
    <CardHeader>
      <CardTitle class="text-base">KpiGrid</CardTitle>
      <CardDescription>Metric tiles with trend indicators.</CardDescription>
    </CardHeader>
    <CardContent>
      <!-- Svelte KpiGrid is a pure layout grid (children), where the Vue
           twin takes an `items` array — tiles render inline here. -->
      <KpiGrid>
        {#each kpiItems as item (item.label)}
          <StatTile
            label={item.label}
            value={item.value}
            delta={item.change}
            deltaTone={item.change.startsWith('-') ? 'negative' : 'positive'}
          />
        {/each}
      </KpiGrid>
    </CardContent>
    <CardFooter class="text-muted-foreground text-xs">
      <span class="inline-flex items-center gap-1"><Check class="size-3" /> Synced 2 minutes ago</span>
    </CardFooter>
  </Card>

  <!-- Command Palette -->
  <Card>
    <CardHeader>
      <CardTitle class="text-base">Command</CardTitle>
      <CardDescription>Keyboard-driven command palette for search and actions.</CardDescription>
    </CardHeader>
    <CardContent>
      <Command class="rounded-lg border shadow-sm">
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Suggestions">
            <CommandItem value="calendar">
              <Hash class="mr-2 size-4" />Calendar
            </CommandItem>
            <CommandItem value="search">
              <Search class="mr-2 size-4" />Search Emoji
            </CommandItem>
            <CommandItem value="calculator">
              <CreditCard class="mr-2 size-4" />Calculator
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Settings">
            <CommandItem value="profile">
              <User class="mr-2 size-4" />Profile
            </CommandItem>
            <CommandItem value="billing">
              <CreditCard class="mr-2 size-4" />Billing
            </CommandItem>
            <CommandItem value="settings">
              <Settings class="mr-2 size-4" />Settings
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </CardContent>
  </Card>

  <!-- Overlays: Dialog, Sheet, Popover, Tooltip, Dropdown -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Dialog</CardTitle>
        <CardDescription>Modal overlay for critical actions.</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog bind:open={dialogOpen}>
          <DialogTrigger>
            {#snippet child({ props })}
              <Button {...props} variant="outline" size="sm">Open dialog</Button>
            {/snippet}
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm action</DialogTitle>
              <DialogDescription>This will permanently delete the selected item. This action cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" size="sm" onclick={() => (dialogOpen = false)}>Cancel</Button>
              <Button variant="destructive" size="sm" onclick={() => (dialogOpen = false)}>Delete</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">Sheet</CardTitle>
        <CardDescription>Slide-in panel for detail views.</CardDescription>
      </CardHeader>
      <CardContent>
        <Sheet bind:open={sheetOpen}>
          <SheetTrigger>
            {#snippet child({ props })}
              <Button {...props} variant="outline" size="sm">Open sheet</Button>
            {/snippet}
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Details</SheetTitle>
              <SheetDescription>View and edit item details.</SheetDescription>
            </SheetHeader>
            <div class="space-y-3 py-4">
              <div class="space-y-1">
                <Label>Name</Label><Input value="Acme Inc" />
              </div>
              <div class="space-y-1">
                <Label>Email</Label><Input value="hello@acme.com" />
              </div>
            </div>
            <Button size="sm" class="w-full" onclick={() => (sheetOpen = false)}>Save</Button>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">Popover + Tooltip</CardTitle>
        <CardDescription>Contextual menus and hover hints.</CardDescription>
      </CardHeader>
      <CardContent class="flex items-center gap-2">
        <Popover>
          <PopoverTrigger>
            {#snippet child({ props })}
              <Button {...props} variant="outline" size="sm">Popover</Button>
            {/snippet}
          </PopoverTrigger>
          <PopoverContent class="w-56">
            <p class="text-sm font-medium">Quick actions</p>
            <p class="text-muted-foreground mt-1 text-xs">Choose an action for this item.</p>
            <Separator class="my-2" />
            <div class="space-y-1">
              <button class="flex w-full items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent">
                <Copy class="size-3" />Copy
              </button>
              <button class="text-destructive flex w-full items-center gap-2 rounded px-2 py-1 text-xs hover:bg-accent">
                <X class="size-3" />Remove
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              {#snippet child({ props })}
                <Button {...props} variant="ghost" size="icon" class="size-8">
                  <AlertCircle class="size-4" />
                </Button>
              {/snippet}
            </TooltipTrigger>
            <TooltipContent><p>More information about this feature</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu>
          <DropdownMenuTrigger>
            {#snippet child({ props })}
              <Button {...props} variant="outline" size="sm">Menu</Button>
            {/snippet}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>View</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem class="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardContent>
    </Card>
  </div>

  <!-- Form elements -->
  <Card>
    <CardHeader>
      <CardTitle class="text-base">Form controls</CardTitle>
      <CardDescription>Inputs, selects, toggles, and validation states.</CardDescription>
    </CardHeader>
    <CardContent class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <div class="space-y-2">
        <Label>Text input</Label>
        <Input placeholder="name@example.com" />
      </div>
      <div class="space-y-2">
        <Label>Password</Label>
        <Input type="password" value="secret123" />
      </div>
      <div class="space-y-2">
        <Label>Select</Label>
        <Select defaultValue="pro">
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="free">Free</SelectItem>
            <SelectItem value="pro">Pro</SelectItem>
            <SelectItem value="enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div class="space-y-2">
        <Label>Textarea</Label>
        <Textarea placeholder="Enter your message..." rows={3} />
      </div>
      <div class="space-y-2">
        <Label for="ui-kit-slider">Slider ({sliderValue[0]}%)</Label>
        <Slider
          id="ui-kit-slider"
          value={sliderValue}
          onValueChange={(v) => (sliderValue = Array.isArray(v) ? v : [v])}
          min={0}
          max={100}
          step={1}
          aria-label="Demo slider"
        />
      </div>
      <div class="space-y-2">
        <Label>Pin Input</Label>
        <PinInput bind:value={otpValue} class="flex gap-2" otp>
          <PinInputGroup>
            <PinInputSlot index={0} />
            <PinInputSlot index={1} />
            <PinInputSlot index={2} />
            <PinInputSeparator />
            <PinInputSlot index={3} />
            <PinInputSlot index={4} />
            <PinInputSlot index={5} />
          </PinInputGroup>
        </PinInput>
      </div>
      <div class="space-y-3">
        <Label>Checkbox</Label>
        <div class="flex items-center gap-2">
          <Checkbox id="terms" />
          <Label for="terms" class="text-sm font-normal">Accept terms</Label>
        </div>
        <div class="flex items-center gap-2">
          <Checkbox id="news" checked={true} />
          <Label for="news" class="text-sm font-normal">Newsletter</Label>
        </div>
      </div>
      <div class="space-y-3">
        <Label>Switch</Label>
        <div class="flex items-center justify-between">
          <Label for="ui-kit-switch-notifications" class="text-sm font-normal">Notifications</Label>
          <Switch id="ui-kit-switch-notifications" defaultChecked={true} />
        </div>
        <div class="flex items-center justify-between">
          <Label for="ui-kit-switch-dark-mode" class="text-sm font-normal">Dark mode</Label>
          <Switch id="ui-kit-switch-dark-mode" />
        </div>
      </div>
      <div class="space-y-3">
        <Label>Radio group</Label>
        <RadioGroup defaultValue="comfortable">
          <div class="flex items-center gap-2">
            <RadioGroupItem value="compact" />
            <Label class="text-sm font-normal">Compact</Label>
          </div>
          <div class="flex items-center gap-2">
            <RadioGroupItem value="comfortable" />
            <Label class="text-sm font-normal">Comfortable</Label>
          </div>
          <div class="flex items-center gap-2">
            <RadioGroupItem value="spacious" />
            <Label class="text-sm font-normal">Spacious</Label>
          </div>
        </RadioGroup>
      </div>
    </CardContent>
  </Card>

  <!-- Toggle + ToggleGroup -->
  <div class="grid gap-4 sm:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Toggle</CardTitle>
        <CardDescription>Binary state button.</CardDescription>
      </CardHeader>
      <CardContent class="flex gap-2">
        <Toggle><Bold class="size-4" /></Toggle>
        <Toggle><Italic class="size-4" /></Toggle>
        <Toggle><Underline class="size-4" /></Toggle>
      </CardContent>
    </Card>
    <Card>
      <CardHeader>
        <CardTitle class="text-base">ToggleGroup</CardTitle>
        <CardDescription>Exclusive or multiple selection.</CardDescription>
      </CardHeader>
      <CardContent>
        <ToggleGroup type="single" value="list">
          <ToggleGroupItem value="list">
            <List class="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="ordered">
            <ListOrdered class="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="link">
            <LinkIcon class="size-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="image">
            <ImageIcon class="size-4" />
          </ToggleGroupItem>
        </ToggleGroup>
      </CardContent>
    </Card>
  </div>

  <!-- Feedback: Progress, Skeleton, ThemeSwitch -->
  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Progress</CardTitle>
        <CardDescription>Visual completion indicator.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="space-y-1">
          <div class="flex justify-between text-xs">
            <span>Uploading</span><span>78%</span>
          </div>
          <Progress value={78} />
        </div>
        <div class="space-y-1">
          <div class="flex justify-between text-xs">
            <span>Processing</span><span>42%</span>
          </div>
          <Progress value={42} />
        </div>
        <div class="space-y-1">
          <div class="flex justify-between text-xs">
            <span>Complete</span><span>100%</span>
          </div>
          <Progress value={100} />
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">Skeleton</CardTitle>
        <CardDescription>Loading placeholder shimmer.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        {#if loadingDemo}
          <div class="flex items-center gap-3">
            <Skeleton class="size-10 rounded-full" />
            <div class="space-y-1">
              <Skeleton class="h-2 w-24" />
              <Skeleton class="h-2 w-32" />
            </div>
          </div>
          <Skeleton class="h-20 w-full" />
          <Skeleton class="h-2 w-full" />
          <Skeleton class="h-2 w-3/4" />
        {:else}
          <div class="text-muted-foreground text-sm">
            <div class="mb-3 flex items-center gap-3">
              <Avatar class="size-10">
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
              <div>
                <p class="font-medium">John Doe</p>
                <p class="text-xs">john@example.com</p>
              </div>
            </div>
            <p>Content loaded successfully.</p>
          </div>
        {/if}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">ThemeSwitch</CardTitle>
        <CardDescription>Light / dark / system toggle.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <ThemeSwitch value="light" variant="cards" />
        <ThemeSwitch value="dark" variant="icons" />
        <ThemeSwitch value="system" variant="pill" />
      </CardContent>
    </Card>
  </div>

  <!-- Accordion + Collapsible -->
  <div class="grid gap-4 sm:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle class="text-base">Accordion</CardTitle>
        <CardDescription>Collapsible content sections.</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="item-1">
            <AccordionTrigger>Is it accessible?</AccordionTrigger>
            <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern for accordions.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>Can I customize styles?</AccordionTrigger>
            <AccordionContent>Absolutely. All components are built with Tailwind and expose class props.</AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Is it SSR-friendly?</AccordionTrigger>
            <AccordionContent>Yes. Components work with SvelteKit SSR and hydration.</AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">Collapsible</CardTitle>
        <CardDescription>Show/hide content with animation.</CardDescription>
      </CardHeader>
      <CardContent>
        <Collapsible>
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium">@peduarte starred 3 repos</p>
            <CollapsibleTrigger>
              {#snippet child({ props })}
                <Button {...props} variant="ghost" size="sm">Toggle</Button>
              {/snippet}
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent class="mt-2 space-y-2">
            <div class="rounded-md border px-3 py-2 font-mono text-xs">@radix-ui/primitives</div>
            <div class="rounded-md border px-3 py-2 font-mono text-xs">@radix-ui/colors</div>
            <div class="rounded-md border px-3 py-2 font-mono text-xs">@radix-ui/react-slot</div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  </div>

  <!-- DataList, SectionCard, IconBox, OverlayScroll -->
  <div class="grid gap-4 sm:grid-cols-2">
    <SectionCard title="Account details" description="Your workspace identity">
      <DataList>
        <DataListItem>
          <span class="text-muted-foreground text-sm">Status</span>
          <Badge variant="secondary">Active</Badge>
        </DataListItem>
        <DataListItem>
          <span class="text-muted-foreground text-sm">Region</span>
          <span class="text-sm">us-east-1</span>
        </DataListItem>
        <DataListItem>
          <span class="text-muted-foreground text-sm">Plan</span>
          <Badge>Pro</Badge>
        </DataListItem>
        <DataListItem>
          <span class="text-muted-foreground text-sm">Seats</span>
          <span class="text-sm">8 of 25</span>
        </DataListItem>
      </DataList>
    </SectionCard>

    <Card>
      <CardHeader>
        <CardTitle class="text-base">IconBox + OverlayScroll</CardTitle>
        <CardDescription>Icon containers and custom scrollbars.</CardDescription>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="flex gap-2">
          <IconBox icon={Mail} />
          <IconBox icon={Settings} variant="muted" />
          <IconBox icon={Palette} variant="muted" />
          <IconBox icon={Fingerprint} variant="outline" />
        </div>
        <OverlayScroll class="h-24 rounded-md border p-2">
          {#each Array(10) as _, i (i)}
            <p class="py-1 text-xs">Scrollable content line {i + 1}</p>
          {/each}
        </OverlayScroll>
        <p class="text-muted-foreground flex items-center gap-1.5 text-xs">
          <MapPin class="size-3" /> Ships from us-east-1
          <span class="ml-auto inline-flex items-center gap-1">
            <Sun class="size-3" /><Moon class="size-3" /> Theme-aware
          </span>
        </p>
      </CardContent>
    </Card>
  </div>

  <!-- Icons row (Loader2 spinner state) -->
  <Card>
    <CardHeader>
      <CardTitle class="text-base">Loading state</CardTitle>
      <CardDescription>Spinner for async actions.</CardDescription>
    </CardHeader>
    <CardContent>
      <Button variant="outline" size="sm" disabled>
        <Loader2 class="size-4 animate-spin" /> Saving…
      </Button>
    </CardContent>
  </Card>

  <!-- Rich Text Editor -->
  <Card>
    <CardHeader>
      <CardTitle class="text-base">RichTextEditor</CardTitle>
      <CardDescription>Tiptap-based editor with formatting toolbar.</CardDescription>
    </CardHeader>
    <CardContent>
      <RichTextEditor class="min-h-[160px]" />
    </CardContent>
  </Card>
</Page>
