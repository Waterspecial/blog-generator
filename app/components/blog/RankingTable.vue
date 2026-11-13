<script setup lang="ts">
import { formatCurrency } from '#shared/utils/format'
import type { Currency, NormalisedRow, StandardField } from '#shared/types'

const props = defineProps<{
  rows: NormalisedRow[]
  fieldsPresent: StandardField[]
  amountLabel: string
  currency: Currency | null
  caption: string
  intro: string
  hideStage: boolean
  locations: string[]
}>()

const show = computed(() => {
  const has = (field: StandardField) => props.fieldsPresent.includes(field)
  return {
    location: has('location'),
    size: has('size'),
    stage: has('stage') && !props.hideStage,
    founded: has('founded'),
    tags: has('tags'),
  }
})

const commonTags = computed(() => {
  const counts = new Map<string, number>()
  for (const row of props.rows) for (const tag of row.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1)
  return new Set([...counts].filter(([, n]) => n / props.rows.length > 0.9).map(([tag]) => tag))
})

function orderedTags(tags: string[]) {
  return [...tags.filter(t => !commonTags.value.has(t)), ...tags.filter(t => commonTags.value.has(t))]
}

const max = computed(() => Math.max(1, ...props.rows.map(row => row.amount)))
const query = ref('')
const location = ref<string | null>(null)
const sort = ref<'rank' | 'founded' | 'name'>('rank')

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  const list = props.rows.filter((row) => {
    if (location.value && row.location !== location.value) return false
    if (!q) return true
    return [row.name, row.location ?? '', ...row.tags].some(text => text.toLowerCase().includes(q))
  })
  if (sort.value === 'name') return [...list].sort((a, b) => a.name.localeCompare(b.name))
  if (sort.value === 'founded') return [...list].sort((a, b) => (a.founded ?? Infinity) - (b.founded ?? Infinity))
  return list
})

const pageSizes = [10, 20, 50]
const pageSize = ref(10)
const page = ref(1)
const sectionEl = ref<HTMLElement | null>(null)

const pageCount = computed(() => Math.max(1, Math.ceil(results.value.length / pageSize.value)))
const start = computed(() => (page.value - 1) * pageSize.value)

function goTo(target: number) {
  page.value = Math.min(Math.max(1, target), pageCount.value)
  // sectionEl.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

watch([query, location, sort, pageSize], () => { page.value = 1 })
</script>

<template>
  <section ref="sectionEl" aria-labelledby="ranking" class="mb-14 rounded-card border border-slate-200 bg-white p-5 sm:p-7">
    <h2 id="ranking" class="mb-1 text-[28px] font-extrabold">The full top {{ rows.length }}</h2>
    <p class="mb-[18px] text-[15px] text-slate-600">{{ intro }}</p>

    <label class="input mb-[18px] w-full max-w-xs bg-white">
      <Icon name="lucide:search" class="size-4 text-slate-500" />
      <span class="sr-only">Search the list</span>
      <input v-model="query" type="search" placeholder="Try a company or city" class="text-[15px]">
    </label>

    <div class="mb-[18px] flex flex-wrap items-center justify-between gap-3">
      <div v-if="locations.length" role="group" aria-label="Filter by location" class="flex flex-wrap gap-2">
        <button
          v-for="option in [null, ...locations]"
          :key="option ?? 'all'"
          type="button"
          class="btn"
          :class="location === option ? 'btn-secondary' : 'border-slate-300 bg-white font-normal'"
          :aria-pressed="location === option"
          @click="location = option"
        >
          {{ option ?? 'All' }}
        </button>
      </div>
      <label class="flex items-center gap-2 text-sm text-slate-600">
        Sort by
        <select v-model="sort" class="select w-auto bg-white text-navy">
          <option value="rank">{{ amountLabel }}</option>
          <option v-if="show.founded" value="founded">Founded</option>
          <option value="name">A to Z</option>
        </select>
      </label>
    </div>

    <div class="-mx-5 overflow-x-auto px-5 sm:mx-0 sm:px-0">
      <table class="table min-w-[720px] text-[15px]">
        <caption class="sr-only">{{ caption }}</caption>
        <thead>
          <tr class="text-[13px] uppercase tracking-[0.04em] text-slate-600">
            <th scope="col" class="sticky left-0 z-10 w-14 bg-white">#</th>
            <th scope="col" class="sticky left-14 z-10 bg-white">Company</th>
            <th v-if="show.location" scope="col">Location</th>
            <th v-if="show.size" scope="col">Employees</th>
            <th v-if="show.stage" scope="col">Stage</th>
            <th v-if="show.founded" scope="col">Founded</th>
            <th scope="col" class="w-[34%]">{{ amountLabel }}</th>
            <th v-if="show.tags" scope="col">Sectors</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, i) in results" v-show="i >= start && i < start + pageSize" :key="`${row.rank}-${row.name}`" class="group hover:bg-base-200">
            <td class="sticky left-0 w-14 bg-white group-hover:bg-base-200">
              <span
                class="inline-flex size-[30px] items-center justify-center"
                :class="row.rank <= 3 ? 'rounded-[10px] bg-navy text-[13px] font-bold text-white' : 'text-sm text-slate-600'"
              >{{ row.rank }}</span>
            </td>
            <th scope="row" class="sticky left-14 bg-white font-bold group-hover:bg-base-200">
              <a v-if="row.website" :href="row.website" target="_blank" rel="nofollow noopener" class="text-navy hover:text-brand">{{ row.name }}</a>
              <span v-else>{{ row.name }}</span>
            </th>
            <td v-if="show.location" class="whitespace-nowrap text-slate-700">{{ row.location ?? '–' }}</td>
            <td v-if="show.size" class="whitespace-nowrap text-slate-700">{{ row.size ?? '–' }}</td>
            <td v-if="show.stage" class="whitespace-nowrap text-slate-700">{{ row.stage ?? '–' }}</td>
            <td v-if="show.founded" class="text-slate-700">{{ row.founded ?? '–' }}</td>
            <td>
              <div class="flex items-center gap-3">
                <span class="h-2 flex-auto overflow-hidden rounded-full bg-slate-200">
                  <span class="block h-full rounded-full bg-brand" :style="{ width: `${(row.amount / max) * 100}%` }" />
                </span>
                <span class="badge h-auto min-w-[52px] whitespace-nowrap border-0 bg-brand-tint px-3 py-1 font-mono text-sm text-brand-dark">
                  {{ formatCurrency(row.amount, currency) }}
                </span>
              </div>
            </td>
            <td v-if="show.tags">
              <BlogSectorBadges :tags="orderedTags(row.tags)" />
            </td>
          </tr>
        </tbody>
      </table>
      <p v-if="!results.length" class="py-8 text-center text-slate-600">No companies match your search.</p>
    </div>

    <div v-if="results.length" class="mt-6 flex flex-wrap items-center justify-end gap-x-6 gap-y-3 text-sm text-slate-600">
      <label class="flex items-center gap-2">
        Rows per page
        <select v-model.number="pageSize" class="select select-sm w-auto bg-white text-navy">
          <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>
      <div class="flex items-center gap-4">
        <p aria-live="polite" class="tabular-nums">{{ start + 1 }}–{{ Math.min(start + pageSize, results.length) }} of {{ results.length }}</p>
        <nav aria-label="Ranking pages" class="flex gap-1">
          <button type="button" class="btn btn-circle btn-ghost" aria-label="Previous page" :disabled="page === 1" @click="goTo(page - 1)">
            <Icon name="lucide:chevron-left" class="size-5" />
          </button>
          <button type="button" class="btn btn-circle btn-ghost" aria-label="Next page" :disabled="page === pageCount" @click="goTo(page + 1)">
            <Icon name="lucide:chevron-right" class="size-5" />
          </button>
        </nav>
      </div>
    </div>
  </section>
</template>
