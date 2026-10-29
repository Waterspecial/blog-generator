<script setup lang="ts">
import type { BlogSummary } from '~~/server/utils/blogStore'

const props = defineProps<{ currentSlug: string }>()

const { data } = await useFetch<BlogSummary[]>('/api/blogs')
const others = computed(() => (data.value ?? []).filter(blog => blog.slug !== props.currentSlug))
</script>

<template>
  <section v-if="others.length" aria-labelledby="explore" class="mb-14">
    <h2 id="explore" class="mb-5 text-[28px] font-extrabold">Explore other industries</h2>
    <div class="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
      <NuxtLink v-for="blog in others" :key="blog.slug" :to="`/blog/${blog.slug}`" class="block rounded-card border border-slate-200 bg-white p-6 text-navy hover:border-brand">
        <span class="mb-1 block text-lg font-bold">{{ blog.industry }}</span>
        <span class="text-sm text-slate-600">View the ranking →</span>
      </NuxtLink>
    </div>
  </section>
</template>
