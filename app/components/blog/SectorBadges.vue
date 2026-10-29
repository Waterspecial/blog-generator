<script setup lang="ts">
const props = defineProps<{ tags: string[] }>()

const rest = computed(() => props.tags.slice(1).join(', '))
</script>

<template>
  <div v-if="tags.length" class="flex items-center gap-1 whitespace-nowrap">
    <span class="badge badge-sm badge-ghost">{{ tags[0] }}</span>
    <span
      v-if="tags.length > 1"
      tabindex="0"
      class="tooltip tooltip-left badge badge-sm badge-ghost cursor-help"
      :data-tip="rest"
      :aria-label="`Also: ${rest}`"
    >+{{ tags.length - 1 }}</span>
  </div>
  <span v-else class="text-slate-500">–</span>
</template>
