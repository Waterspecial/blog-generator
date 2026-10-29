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
  <div class="bg-navy text-white">
    <div class="mx-auto max-w-[1160px] px-6 pb-[116px] pt-9">
      <nav aria-label="Breadcrumb" class="mb-[18px] text-sm text-brand-mist">
        <ol class="flex flex-wrap gap-1">
          <li><NuxtLink to="/" class="text-brand-mist underline hover:text-white">Home</NuxtLink> ›</li>
          <li><NuxtLink to="/blog" class="text-brand-mist underline hover:text-white">Blog</NuxtLink> ›</li>
          <li aria-current="page">{{ industry }}</li>
        </ol>
      </nav>
      <span class="badge mb-[18px] h-auto border-0 bg-navy-soft px-3.5 py-1.5 text-sm font-semibold text-brand-tint">
        UK {{ industry.toLowerCase() }} · {{ year }} ranking
      </span>
      <h1 class="mb-4 max-w-[840px] text-4xl font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[50px]">{{ h1 }}</h1>
      <p v-for="(paragraph, i) in intro" :key="i" class="mb-4 max-w-[760px] text-lg text-brand-tint sm:text-[19px]">{{ paragraph }}</p>
      <div class="mt-6 flex flex-wrap items-center gap-3">
        <a href="#ranking" class="btn btn-primary btn-lg text-base">Jump to the ranking</a>
        <a href="#faq" class="btn btn-outline btn-lg border-navy-line text-base font-semibold text-white hover:border-navy-line hover:bg-navy-soft">Read the FAQs</a>
        <span class="ml-1 text-sm text-brand-mist">
          Updated <time :datetime="publishedIso">{{ published }}</time> · Source: {{ sourceName }}
        </span>
      </div>
    </div>
  </div>
</template>
