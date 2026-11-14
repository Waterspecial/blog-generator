<script setup lang="ts">
const { siteName } = useRuntimeConfig().public

useSeoMeta({
  ogSiteName: siteName,
  ogLocale: 'en_GB',
})
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <AppToasts />
</template>
