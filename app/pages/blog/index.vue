<script setup lang="ts">
const { data: blogs } = await useFetch('/api/blogs')
const config = useRuntimeConfig()

const title = `Blog | ${config.public.siteName}`
const description = 'Data-driven rankings of UK companies by industry, built from real datasets.'
const pageUrl = `${config.public.siteUrl.replace(/\/$/, '')}/blog`

useSeoMeta({
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogType: 'website',
  ogUrl: pageUrl,
})

useHead({
  link: [{ rel: 'canonical', href: pageUrl }],
})
</script>

<template>
  <main>
    <PageHero title="Industry rankings" :crumbs="[{ label: 'Home', to: '/' }, { label: 'Blog' }]" overlap>
      <p class="max-w-190 text-base text-brand-tint sm:text-lg">Data-driven rankings of UK companies by industry.</p>
    </PageHero>

    <div class="mx-auto -mt-19 max-w-290 px-6 pb-16">
      <ul v-if="blogs?.length" class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <li v-for="blog in blogs" :key="blog.slug">
          <BlogSummaryCard :blog="blog" />
        </li>
      </ul>
      <p v-else class="rounded-card bg-white p-6 text-slate-600 shadow-card">No blogs yet. Run <code>npm run seed</code> to create the first one.</p>
    </div>
  </main>
</template>
