<script setup lang="ts">
defineProps<{
  industry: string
  h1: string
  intro: string[]
  published: string
  publishedIso: string
  year: number
  sourceName: string
}>()
</script>

<template>
  <PageHero
    :title="h1"
    :crumbs="[{ label: 'Home', to: '/' }, { label: 'Blog', to: '/blog' }, { label: industry }]"
    overlap
  >
    <template #badge>
      <span class="badge mb-[18px] h-auto border-0 bg-navy-soft px-3.5 py-1.5 text-sm font-semibold text-brand-tint">
        UK {{ industry.toLowerCase() }} · {{ year }} ranking
      </span>
    </template>
    <p v-for="(paragraph, i) in intro" :key="i" class="mb-4 max-w-[760px] text-base text-brand-tint sm:text-lg">{{ paragraph }}</p>
    <div class="mt-6 flex flex-wrap items-center gap-3">
      <a href="#ranking" class="btn btn-primary btn-lg text-base">Jump to the ranking</a>
      <a href="#faq" class="btn btn-outline btn-lg border-navy-line text-base font-semibold text-white hover:border-navy-line hover:bg-navy-soft">Read the FAQs</a>
      <span class="ml-1 text-sm text-brand-mist">
        Updated <time :datetime="publishedIso">{{ published }}</time> · Source: {{ sourceName }}
      </span>
    </div>
  </PageHero>
</template>
