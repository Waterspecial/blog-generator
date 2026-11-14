<script setup lang="ts">
const { toasts, remove } = useToast()

const styles = {
  success: { alert: 'alert-success', icon: 'lucide:circle-check' },
  error: { alert: 'alert-error', icon: 'lucide:circle-alert' },
  warning: { alert: 'alert-warning', icon: 'lucide:triangle-alert' },
  info: { alert: 'alert-info', icon: 'lucide:info' },
}
</script>

<template>
  <div class="toast toast-bottom toast-center z-50 w-full max-w-sm sm:toast-end" aria-live="polite">
    <div v-for="toast in toasts" :key="toast.id" :role="toast.kind === 'error' ? 'alert' : 'status'"
      class="alert flex items-start text-left" :class="styles[toast.kind].alert">
      <Icon :name="styles[toast.kind].icon" class="mt-0.5 size-5 shrink-0" />
      <div class="flex-1">
        <p class="whitespace-normal">{{ toast.message }}</p>
        <NuxtLink v-if="toast.link" :to="toast.link.to" class="link font-semibold">{{ toast.link.label }}</NuxtLink>
      </div>
      <button type="button" class="btn btn-ghost btn-xs btn-circle" aria-label="Dismiss" @click="remove(toast.id)">
        <Icon name="lucide:x" class="size-4" />
      </button>
    </div>
  </div>
</template>
