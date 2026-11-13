<script setup lang="ts">
import { formatCurrency } from '#shared/utils/format'
import type { Currency, NormalisedRow } from '#shared/types'

const props = defineProps<{ rows: NormalisedRow[], currency: Currency | null, amountLabel: string }>()

const top = computed(() => props.rows.slice(0, 10))
const max = computed(() => Math.max(1, ...top.value.map(row => row.amount)))
</script>

<template>
  <section aria-labelledby="top10" class="min-w-0 flex-[999_1_560px] rounded-card border border-slate-200 bg-white p-5 sm:p-7">
    <h2 id="top10" class="mb-1 text-[22px] font-extrabold">The top {{ top.length }} at a glance</h2>
    <p class="mb-6 text-sm text-slate-600">{{ amountLabel }}</p>
    <ol class="flex flex-col gap-4 sm:gap-3">
      <li
        v-for="row in top"
        :key="row.rank"
        class="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1.5 text-sm sm:grid-cols-[28px_150px_minmax(0,1fr)_64px]"
      >
        <span class="font-mono text-slate-600">{{ row.rank }}</span>
        <span class="truncate font-semibold">{{ row.name }}</span>
        <span class="col-span-2 col-start-2 row-start-2 h-2.5 overflow-hidden rounded-full bg-slate-200 sm:col-span-1 sm:col-start-3 sm:row-start-1 sm:h-3.5">
          <span class="block h-full rounded-full bg-brand" :style="{ width: `${(row.amount / max) * 100}%` }" />
        </span>
        <span class="text-right font-mono sm:col-start-4">{{ formatCurrency(row.amount, currency) }}</span>
      </li>
    </ol>
  </section>
</template>
