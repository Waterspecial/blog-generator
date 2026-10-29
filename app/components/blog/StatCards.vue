<script setup lang="ts">
import type { Stats } from '#shared/computeStats'
import { formatCurrency, formatPercent } from '#shared/format'
import type { Currency } from '#shared/normalise'

const props = defineProps<{ stats: Stats, currency: Currency | null, amountLabel: string, year: number }>()

const cards = computed(() => {
  const { stats, currency, amountLabel, year } = props
  const metric = amountLabel.replace(/^total\s+/i, '').toLowerCase()
  const list = [
    { label: `Total ${metric}`, value: formatCurrency(stats.amount.total, currency), note: `Across the top ${stats.companyCount}` },
    { label: 'Top 10 share', value: formatPercent(stats.amount.top10Share), note: 'Of the total' },
    { label: `Median ${metric}`, value: formatCurrency(stats.amount.median, currency), note: 'Per company' },
  ]
  if (stats.location) {
    list.push({ label: `Based in ${stats.location.topName}`, value: formatPercent(stats.location.topShare), note: `Of the top ${stats.companyCount}` })
  }
  if (stats.founded) {
    list.push({ label: 'Median age', value: `${year - stats.founded.medianYear} yrs`, note: 'Since founding' })
  }
  return list
})
</script>

<template>
  <section aria-label="Headline statistics" class="mb-14 grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-4">
    <div v-for="card in cards" :key="card.label" class="rounded-card bg-white p-6 shadow-card">
      <p class="mb-2.5 text-[13px] font-bold uppercase tracking-[0.05em] text-slate-600">{{ card.label }}</p>
      <p class="mb-1 font-mono text-[32px] font-medium">{{ card.value }}</p>
      <p class="text-sm text-slate-600">{{ card.note }}</p>
    </div>
  </section>
</template>
