<script setup lang="ts">
const { siteName } = useRuntimeConfig().public
</script>

<template>
  <div class="min-h-screen bg-page font-sans leading-relaxed text-navy">
    <header class="bg-navy text-white">
      <nav aria-label="Main" class="mx-auto flex max-w-[1160px] flex-wrap items-center justify-between gap-4 px-6 py-4">
        <NuxtLink to="/" class="inline-flex items-center gap-2.5 text-xl font-extrabold text-white">
          <svg aria-hidden="true" width="26" height="26" viewBox="0 0 28 28" fill="none">
            <rect x="2" y="14" width="6" height="12" rx="2" fill="#93C5FD" />
            <rect x="11" y="8" width="6" height="18" rx="2" fill="#93C5FD" />
            <rect x="20" y="2" width="6" height="24" rx="2" fill="#ffffff" />
          </svg>
          {{ siteName }}
        </NuxtLink>
        <NuxtLink to="/blog" class="px-3.5 py-2.5 font-medium text-brand-tint hover:text-white">Rankings</NuxtLink>
      </nav>
    </header>

    <slot />

    <footer class="bg-navy text-brand-tint">
      <div class="mx-auto max-w-[1160px] px-6 py-8 text-sm">
        {{ siteName }} · Rankings generated from company datasets
      </div>
    </footer>
  </div>
</template>
