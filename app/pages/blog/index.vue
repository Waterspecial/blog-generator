<script setup lang="ts">
const { data: blogs } = await useFetch('/api/blogs')
const config = useRuntimeConfig()

useSeoMeta({
  title: `Blog | ${config.public.siteName}`,
  description: 'Data-driven rankings of UK companies by industry, built from real datasets.',
  ogType: 'website',
})

useHead({
  link: [{ rel: 'canonical', href: `${config.public.siteUrl.replace(/\/$/, '')}/blog` }],
})
</script>

<template>
  <main class="mx-auto max-w-3xl px-4 py-8">
    <h1 class="text-3xl font-bold">Industry rankings</h1>
    <p class="mt-2 text-slate-600">Data-driven rankings of UK companies by industry.</p>

    <ul v-if="blogs?.length" class="mt-8 space-y-6">
      <li v-for="blog in blogs" :key="blog.slug" class="rounded-lg border border-slate-200 p-5">
        <p class="text-sm font-medium text-blue-700">{{ blog.industry }}</p>
        <h2 class="mt-1 text-xl font-semibold">
          <NuxtLink :to="`/blog/${blog.slug}`" class="hover:underline">{{ blog.title }}</NuxtLink>
        </h2>
        <p class="mt-2 text-slate-600">{{ blog.metaDescription }}</p>
      </li>
    </ul>
    <p v-else class="mt-8 text-slate-600">No blogs yet. Run <code>npm run seed</code> to create the first one.</p>
  </main>
</template>
