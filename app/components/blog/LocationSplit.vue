<script setup lang="ts">
import type { Stats } from '#shared/computeStats'
import { formatPercent } from '#shared/format'

const props = defineProps<{ location: NonNullable<Stats['location']>, companyCount: number }>()

const items = computed(() => {
  const top = props.location.counts.slice(0, 3)
  const other = props.companyCount - top.reduce((sum, [, count]) => sum + count, 0)
  const list = top.map(([name, count]) => ({ name, share: count / props.companyCount }))
  if (other > 0) list.push({ name: 'Other', share: other / props.companyCount })
  return list
})
</script>

<template>
  <section aria-labelledby="split" class="min-w-0 flex-[1_1_300px] rounded-card bg-navy p-7 text-white">
    <h2 id="split" class="mb-1 text-[22px] font-extrabold">Where they are based</h2>
    <p class="mb-6 text-sm text-brand-mist">Share of the top {{ companyCount }} by location</p>
    <ul class="flex flex-col gap-[18px]">
      <li v-for="item in items" :key="item.name">
        <div class="mb-1.5 flex justify-between text-sm">
          <span>{{ item.name }}</span>
          <span class="font-mono">{{ formatPercent(item.share) }}</span>
        </div>
        <div class="h-2.5 overflow-hidden rounded-full bg-navy-soft">
          <div class="h-full rounded-full bg-brand-light" :style="{ width: `${item.share * 100}%` }" />
        </div>
      </li>
    </ul>
  </section>
</template>
