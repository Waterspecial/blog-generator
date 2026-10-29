<script setup lang="ts">
import type { Stats } from '#shared/computeStats'
import { formatPercent } from '#shared/format'
import type { BlogContent } from '#shared/schemas'

const props = defineProps<{ sections: BlogContent['sections'], stats: Stats }>()

function headline(key: BlogContent['sections'][number]['statKey']): string | null {
  const { stats } = props
  switch (key) {
    case 'amount': return formatPercent(stats.amount.top10Share)
    case 'location': return stats.location ? formatPercent(stats.location.topShare) : null
    case 'size': return stats.size?.mostCommon ?? null
    case 'stage': return stats.stage?.counts[0]?.[0] ?? null
    case 'founded': return stats.founded ? String(stats.founded.medianYear) : null
    case 'tags': {
      const top = stats.tags?.top[0]
      return top ? formatPercent(top[1] / stats.companyCount) : null
    }
    default: return null
  }
}
</script>

<template>
  <section aria-labelledby="insight" class="mb-14 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-5">
    <h2 id="insight" class="col-span-full text-[28px] font-extrabold">What the data tells us</h2>
    <div v-for="section in sections" :key="section.heading" class="rounded-card border border-slate-200 bg-white p-6">
      <p v-if="headline(section.statKey)" class="mb-1.5 font-mono text-2xl text-brand">{{ headline(section.statKey) }}</p>
      <h3 class="mb-2 text-lg font-bold">{{ section.heading }}</h3>
      <p v-for="(paragraph, i) in section.body.split(/\n\n+/)" :key="i" class="mt-2 text-slate-600 first-of-type:mt-0">{{ paragraph }}</p>
    </div>
  </section>
</template>
