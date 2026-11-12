<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  crumbs?: { label: string, to?: string }[]
  overlap?: boolean
}>(), { crumbs: () => [], overlap: false })
</script>

<template>
  <div class="bg-navy text-white">
    <div class="mx-auto max-w-[1160px] px-6 pt-9" :class="overlap ? 'pb-[116px]' : 'pb-12'">
      <nav v-if="crumbs.length" aria-label="Breadcrumb" class="mb-[18px] text-sm text-brand-mist">
        <ol class="flex flex-wrap gap-1">
          <li v-for="(crumb, i) in crumbs" :key="crumb.label" :aria-current="crumb.to ? undefined : 'page'">
            <NuxtLink v-if="crumb.to" :to="crumb.to" class="text-brand-mist underline hover:text-white">{{ crumb.label }}</NuxtLink>
            <template v-else>{{ crumb.label }}</template>
            <template v-if="i < crumbs.length - 1"> ›</template>
          </li>
        </ol>
      </nav>
      <slot name="badge" />
      <h1 class="mb-3 max-w-[840px] text-[28px] font-extrabold leading-[1.1] tracking-[-0.02em] sm:text-[40px]">{{ title }}</h1>
      <slot />
    </div>
  </div>
</template>
