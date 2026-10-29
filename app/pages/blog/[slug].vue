<script setup lang="ts">
import type { BlogDocument } from '#shared/schemas'

const route = useRoute()
const slug = String(route.params.slug)
const config = useRuntimeConfig()

const { data } = await useFetch<BlogDocument>(`/api/blogs/${slug}`)
if (!data.value) throw createError({ statusCode: 404, statusMessage: 'Blog not found', fatal: true })

const blog = data.value
const { content } = blog
const siteUrl = config.public.siteUrl.replace(/\/$/, '')
const pageUrl = `${siteUrl}/blog/${blog.slug}`
const siteName = config.public.siteName
const published = new Date(blog.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
const year = new Date(blog.createdAt).getFullYear()
const intro = content.intro.split(/\n\n+/)

useSeoMeta({
  title: content.title,
  description: content.metaDescription,
  ogTitle: content.title,
  ogDescription: content.metaDescription,
  ogType: 'article',
  ogUrl: pageUrl,
  ogSiteName: siteName,
  ogLocale: 'en_GB',
  twitterCard: 'summary',
  twitterTitle: content.title,
  twitterDescription: content.metaDescription,
  keywords: content.keywords.join(', '),
})

const organisation = { '@type': 'Organization', 'name': siteName, 'url': siteUrl }
const jsonLd = [
  {
    '@context': 'https://schema.org',
    '@type': 'Article',
    'headline': content.title,
    'description': content.metaDescription,
    'datePublished': blog.createdAt,
    'dateModified': blog.createdAt,
    'author': organisation,
    'publisher': organisation,
    'mainEntityOfPage': pageUrl,
    'keywords': content.keywords.join(', '),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': content.h1,
    'numberOfItems': blog.rows.length,
    'itemListElement': blog.rows.map(row => ({
      '@type': 'ListItem',
      'position': row.rank,
      'name': row.name,
      ...(row.website ? { url: row.website } : {}),
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    'mainEntity': content.faqs.map(faq => ({
      '@type': 'Question',
      'name': faq.question,
      'acceptedAnswer': { '@type': 'Answer', 'text': faq.answer },
    })),
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': `${siteUrl}/` },
      { '@type': 'ListItem', 'position': 2, 'name': 'Blog', 'item': `${siteUrl}/blog` },
      { '@type': 'ListItem', 'position': 3, 'name': content.title, 'item': pageUrl },
    ],
  },
]

useHead({
  htmlAttrs: { lang: 'en-GB' },
  link: [{ rel: 'canonical', href: pageUrl }],
  script: jsonLd.map(item => ({
    type: 'application/ld+json',
    innerHTML: JSON.stringify(item).replace(/</g, '\\u003c'),
  })),
})
</script>

<template>
  <main>
    <article>
      <BlogHero
        :industry="blog.industry"
        :h1="content.h1"
        :intro="intro"
        :published="published"
        :published-iso="blog.createdAt"
        :year="year"
        :source-name="blog.source.fileName"
      />

      <div class="mx-auto -mt-[76px] max-w-[1160px] px-6 pb-20">
        <BlogStatCards :stats="blog.stats" :currency="blog.currency" :amount-label="blog.amountLabel" :year="year" />

        <BlogPodium :rows="blog.rows" :currency="blog.currency" :amount-label="blog.amountLabel" />

        <div class="mb-14 flex flex-wrap gap-6">
          <BlogTopTenBars :rows="blog.rows" :currency="blog.currency" :amount-label="blog.amountLabel" />
          <BlogLocationSplit v-if="blog.stats.location" :location="blog.stats.location" :company-count="blog.stats.companyCount" />
        </div>

        <BlogRankingTable
          :rows="blog.rows"
          :fields-present="blog.fieldsPresent"
          :amount-label="blog.amountLabel"
          :currency="blog.currency"
          :caption="content.h1"
          :intro="content.tableIntro"
          :hide-stage="Boolean(blog.stats.context.stage)"
          :locations="blog.stats.location?.counts.slice(0, 3).map(([name]) => name) ?? []"
        />

        <BlogInsightCards :sections="content.sections" :stats="blog.stats" />

        <BlogFaqList :faqs="content.faqs" />

        <BlogExploreIndustries :current-slug="blog.slug" />

        <section class="rounded-card border border-slate-200 bg-white p-6 text-sm text-slate-600">
          <h2 class="mb-1 text-base font-bold text-navy">Data source and methodology</h2>
          <p>
            Based on {{ blog.source.rowCount }} rows from {{ blog.source.fileName }}, ranked by {{ blog.amountLabel }}.
            All figures are calculated directly from the dataset. Generated on {{ published }}.
          </p>
        </section>
      </div>
    </article>
  </main>
</template>
