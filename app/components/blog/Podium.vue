<script setup lang="ts">
import { formatCurrency } from '#shared/format'
import type { Currency, NormalisedRow } from '#shared/normalise'

const props = defineProps<{ rows: NormalisedRow[], currency: Currency | null, amountLabel: string }>()

const podium = computed(() => props.rows.slice(0, 3).map(row => ({
  ...row,
  meta: [row.location, row.founded && `Founded ${row.founded}`].filter(Boolean).join(' · '),
})))
</script>

<template>
  <section aria-labelledby="podium" class="mb-14">
    <h2 id="podium" class="mb-5 text-[28px] font-extrabold">Meet the top three</h2>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
      <article v-for="row in podium" :key="row.rank" class="rounded-card border border-slate-200 bg-white p-7">
        <p class="mb-5 font-mono text-[30px] font-medium text-brand">#{{ row.rank }}</p>
        <h3 class="mb-1 text-xl font-bold">{{ row.name }}</h3>
        <p v-if="row.meta" class="mb-4 text-[15px] text-slate-600">{{ row.meta }}</p>
        <p class="text-sm text-slate-600">{{ amountLabel }}</p>
        <p class="font-mono text-[26px] font-medium">{{ formatCurrency(row.amount, currency) }}</p>
      </article>
    </div>
  </section>
</template>
