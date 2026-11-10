<script setup lang="ts">
import Papa from 'papaparse'
import { detectFields } from '#shared/detectFields'
import { FIELD_DEFINITIONS, STANDARD_FIELDS, type ColumnMapping, type StandardField } from '#shared/fields'
import type { RawRow } from '#shared/normalise'
import type { BlogSummary } from '~~/server/utils/blogStore'

useSeoMeta({
  title: 'UK Industry Rankings: Data-Driven Company Rankings',
  description: 'Rankings of UK companies by industry, built from real company data. Upload a CSV and get an SEO-ready ranking page in minutes.',
})

const { data: blogs } = await useFetch<BlogSummary[]>('/api/blogs')

const file = ref<File | null>(null)
const headers = ref<string[]>([])
const rowCount = ref(0)
const columns = ref({} as Record<StandardField, string>)
const industry = ref('')
const generating = ref(false)
const error = ref('')
const fallbackUrl = ref('')

const canGenerate = computed(() => file.value && columns.value.name && columns.value.amount && industry.value.trim())

function selectFile(selected: File | undefined) {
  if (!selected) return
  error.value = ''
  fallbackUrl.value = ''
  Papa.parse<RawRow>(selected, {
    header: true,
    skipEmptyLines: true,
    complete: ({ data, meta }) => {
      file.value = selected
      headers.value = meta.fields ?? []
      rowCount.value = data.length
      const detected = Object.fromEntries(Object.entries(detectFields(headers.value, data.slice(0, 5))).map(([header, field]) => [field, header]))
      columns.value = Object.fromEntries(STANDARD_FIELDS.map(field => [field, detected[field] ?? ''])) as Record<StandardField, string>
      industry.value = selected.name.replace(/\.csv$/i, '').replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    },
  })
}

async function generate() {
  if (!file.value) return
  const mapping: ColumnMapping = {}
  for (const field of STANDARD_FIELDS) if (columns.value[field]) mapping[columns.value[field]] = field

  const body = new FormData()
  body.append('file', file.value)
  body.append('industry', industry.value)
  body.append('mapping', JSON.stringify(mapping))

  generating.value = true
  error.value = ''
  try {
    const result = await $fetch<{ url: string, contentSource: string }>('/api/generate', { method: 'POST', body })
    if (result.contentSource === 'fallback') fallbackUrl.value = result.url
    else await navigateTo(result.url)
  }
  catch (e) {
    error.value = (e as { data?: { message?: string } }).data?.message ?? 'Something went wrong'
  }
  generating.value = false
}
</script>

<template>
  <main class="mx-auto max-w-[1160px] px-6 py-12">
    <h1 class="mb-2 text-4xl font-extrabold tracking-[-0.02em]">Create a blog page from a dataset</h1>
    <p class="mb-8 text-lg text-slate-600">Upload a CSV, check the columns, and the AI writes the copy into the shared blog template.</p>

    <div class="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
      <div class="flex flex-col gap-6">
        <section aria-labelledby="upload" class="rounded-card border border-slate-200 bg-white p-6">
          <h2 id="upload" class="mb-4 text-xl font-extrabold">1. Dataset</h2>
          <label
            v-if="!file"
            class="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-page p-10 text-center hover:border-brand"
            @dragover.prevent
            @drop.prevent="selectFile($event.dataTransfer?.files[0])"
          >
            <Icon name="lucide:upload" class="size-9 text-brand" />
            <span class="font-semibold">Drop a CSV here or browse files</span>
            <span class="text-sm text-slate-600">One row per company. Up to 2 MB.</span>
            <input type="file" accept=".csv" class="sr-only" @change="selectFile(($event.target as HTMLInputElement).files?.[0])">
          </label>
          <div v-else class="flex items-center gap-3 rounded-2xl bg-brand-tint/50 p-4">
            <Icon name="lucide:file-text" class="size-5 text-brand" />
            <span class="flex-1 text-sm"><strong>{{ file.name }}</strong> · {{ rowCount }} rows · {{ headers.length }} columns</span>
            <button type="button" class="btn btn-sm" @click="file = null">Replace</button>
          </div>
        </section>

        <section v-if="file" aria-labelledby="map" class="rounded-card border border-slate-200 bg-white p-6">
          <h2 id="map" class="mb-1 text-xl font-extrabold">2. Check the columns</h2>
          <p class="mb-5 text-sm text-slate-600">We matched your columns automatically. Change any that look wrong.</p>
          <div class="grid gap-4 sm:grid-cols-2">
            <label v-for="field in STANDARD_FIELDS" :key="field" class="flex flex-col gap-1 text-sm font-semibold">
              {{ FIELD_DEFINITIONS[field].label }}{{ FIELD_DEFINITIONS[field].required ? '' : ' (optional)' }}
              <select v-model="columns[field]" class="select w-full bg-white font-normal">
                <option value="">Not in this file</option>
                <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
              </select>
            </label>
          </div>
          <label class="mt-5 flex flex-col gap-1 text-sm font-semibold">
            Industry name
            <input v-model="industry" type="text" class="input w-full bg-white font-normal">
          </label>
        </section>

        <section v-if="file" aria-labelledby="gen" class="rounded-card border border-slate-200 bg-white p-6">
          <h2 id="gen" class="mb-1 text-xl font-extrabold">3. Generate</h2>
          <p class="mb-5 text-sm text-slate-600">Stats are calculated from the CSV first, then the AI writes the copy. This takes about 30 seconds.</p>
          <button type="button" class="btn btn-primary btn-lg" :disabled="!canGenerate || generating" @click="generate">
            <span v-if="generating" class="loading loading-spinner" />
            {{ generating ? 'Generating copy with AI…' : 'Generate blog page' }}
          </button>
          <div v-if="error" role="alert" class="alert alert-error mt-4">{{ error }}</div>
          <div v-if="fallbackUrl" role="status" class="alert alert-warning mt-4">
            The AI was unavailable, so template copy was used.
            <NuxtLink :to="fallbackUrl" class="link font-semibold">View the page</NuxtLink>
          </div>
        </section>
      </div>

      <aside aria-labelledby="recent" class="rounded-card border border-slate-200 bg-white p-6">
        <h2 id="recent" class="mb-3 text-lg font-extrabold">Generated pages</h2>
        <ul v-if="blogs?.length" class="divide-y divide-slate-100">
          <li v-for="blog in blogs" :key="blog.slug" class="py-3">
            <NuxtLink :to="`/blog/${blog.slug}`" class="font-semibold text-navy hover:text-brand">{{ blog.title }}</NuxtLink>
            <span class="block text-sm text-slate-600">/blog/{{ blog.slug }} · {{ new Date(blog.createdAt).toLocaleDateString('en-GB') }}</span>
          </li>
        </ul>
        <p v-else class="text-sm text-slate-600">No pages yet.</p>
      </aside>
    </div>
  </main>
</template>
