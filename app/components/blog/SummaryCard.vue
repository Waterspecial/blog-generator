<script setup lang="ts">
import type { BlogSummary } from '#shared/types'
import { formatCurrency } from '#shared/utils/format'

defineProps<{ blog: BlogSummary }>()
</script>

<template>
  <article class="relative flex h-full flex-col rounded-card bg-white p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-lg">
    <span class="badge mb-3 h-auto self-start border-0 bg-brand-tint px-3 py-1 text-xs font-semibold text-brand-dark">{{ blog.industry }}</span>
    <h2 class="mb-2 text-lg font-extrabold leading-snug">
      <NuxtLink :to="`/blog/${blog.slug}`" class="after:absolute after:inset-0">{{ blog.title }}</NuxtLink>
    </h2>
    <p class="mb-5 line-clamp-3 text-sm text-slate-600">{{ blog.metaDescription }}</p>
    <dl class="mt-auto grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
      <div>
        <dt class="text-xs font-bold uppercase tracking-[0.05em] text-slate-500">Companies</dt>
        <dd class="font-mono text-base">{{ blog.companyCount }}</dd>
      </div>
      <div>
        <dt class="text-xs font-bold uppercase tracking-[0.05em] text-slate-500">{{ blog.amountLabel }}</dt>
        <dd class="font-mono text-base">{{ formatCurrency(blog.amountTotal, blog.currency) }}</dd>
      </div>
      <div class="min-w-0">
        <dt class="text-xs font-bold uppercase tracking-[0.05em] text-slate-500">#1</dt>
        <dd class="truncate text-base font-semibold">{{ blog.topCompany }}</dd>
      </div>
    </dl>
    <span class="mt-4 text-sm font-semibold text-brand">Read the ranking →</span>
  </article>
</template>
