<script lang="ts">
  import { Search } from '@lucide/svelte'
  import { Badge } from '$lib/components/ui/badge'
  import { Input } from '$lib/components/ui/input'

  let searchQuery = $state('')
  let selectedRole = $state('All Roles')
  const employees = [
    {
      id: '1',
      name: 'Sophia Chen',
      role: 'Staff Design Engineer',
      team: 'Design Systems',
      status: 'Active',
      location: 'San Francisco, CA',
    },
    {
      id: '2',
      name: 'Marcus Vance',
      role: 'Principal Distributed Systems',
      team: 'Core Infrastructure',
      status: 'Active',
      location: 'London, UK',
    },
    {
      id: '3',
      name: 'Elena Rostova',
      role: 'Lead Security Architect',
      team: 'SecOps',
      status: 'In Review',
      location: 'Berlin, DE',
    },
    {
      id: '4',
      name: 'Devon Taylor',
      role: 'Head of Product',
      team: 'Enterprise Suite',
      status: 'Active',
      location: 'New York, NY',
    },
  ]

  const filteredEmployees = $derived(
    employees.filter((emp) => {
      const matchQuery =
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.role.toLowerCase().includes(searchQuery.toLowerCase())
      const matchRole = selectedRole === 'All Roles' || emp.team === selectedRole
      return matchQuery && matchRole
    }),
  )
</script>

<div class="space-y-4">
  <div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
    <div class="relative w-full sm:w-64">
      <Search class="text-muted-foreground absolute top-2.5 left-2.5 size-3.5" />
      <Input bind:value={searchQuery} placeholder="Search 1,420 employees..." class="h-8 pl-8 font-sans text-xs" />
    </div>
    <div class="flex items-center gap-2 self-end sm:self-auto">
      <span class="text-muted-foreground font-mono text-xs">Filter Team:</span>
      <select
        bind:value={selectedRole}
        class="border-input bg-background text-foreground focus:ring-ring h-8 rounded-md border px-2 py-1 text-xs focus:ring-1 focus:outline-none"
      >
        <option value="All Roles">All Teams</option>
        <option value="Design Systems">Design Systems</option>
        <option value="Core Infrastructure">Core Infrastructure</option>
        <option value="SecOps">SecOps</option>
        <option value="Enterprise Suite">Enterprise Suite</option>
      </select>
    </div>
  </div>

  <div class="border-border divide-border bg-background divide-y overflow-hidden rounded-lg border">
    {#each filteredEmployees as emp (emp.id)}
      <div class="hover:bg-muted/40 flex items-center justify-between p-3 text-xs transition-colors">
        <div class="flex items-center gap-3">
          <div
            class="bg-primary/10 text-primary border-primary/20 flex size-8 items-center justify-center rounded-full border text-xs font-semibold"
          >
            {emp.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div>
            <p class="text-foreground font-medium">{emp.name}</p>
            <p class="text-muted-foreground text-xs">{emp.role} · {emp.team}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-muted-foreground hidden font-mono text-xs sm:inline-block">{emp.location}</span>
          <Badge variant="outline" class="border-success/20 bg-success/10 text-success font-mono text-xs">
            {emp.status}
          </Badge>
        </div>
      </div>
    {/each}
  </div>
</div>
