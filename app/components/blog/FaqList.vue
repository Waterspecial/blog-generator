<script setup lang="ts">
import type { BlogContent } from '#shared/schemas'

defineProps<{ faqs: BlogContent['faqs'] }>()
</script>

<template>
  <section aria-labelledby="faq" class="mx-auto mb-14 max-w-[800px]">
    <h2 id="faq" class="mb-5 text-center text-[28px] font-extrabold">Questions people ask</h2>
    <div class="flex flex-col gap-2.5">
      <details v-for="faq in faqs" :key="faq.question" class="collapse collapse-arrow rounded-2xl border border-slate-200 bg-white">
        <summary class="collapse-title text-[17px] font-bold">{{ faq.question }}</summary>
        <div class="collapse-content text-slate-600">
          <p>{{ faq.answer }}</p>
        </div>
      </details>
    </div>
  </section>
</template>
