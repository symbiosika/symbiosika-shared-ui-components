<template>
  <div class="ink-mde-wrapper" :style="{ minHeight: height }">
    <InkMde v-model="markdown" :options="editorOptions" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import InkMde from 'ink-mde/vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  height?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const markdown = ref(props.modelValue || '')

const height = computed(() => props.height || '500px')

const editorOptions = computed(() => ({
  interface: {
    appearance: 'auto' as const,
    attribution: false,
    toolbar: true,
  },
  toolbar: {
    image: false,
    link: false,
  },
  placeholder: props.placeholder || '',
}))

// Sync external changes to internal state
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== markdown.value) {
      markdown.value = newValue || ''
    }
  },
  { immediate: true },
)

// Emit changes to parent
watch(markdown, (newValue) => {
  emit('update:modelValue', newValue)
})
</script>

<style scoped>
.ink-mde-wrapper {
  border: 1px solid var(--p-input-border-color);
  border-radius: var(--p-border-radius);
  overflow: hidden;
}

.ink-mde-wrapper :deep(.ink-mde) {
  height: 100%;
}

/* Hide image and link buttons in toolbar */
.ink-mde-wrapper :deep(.ink-mde-toolbar button[data-command='image']),
.ink-mde-wrapper :deep(.ink-mde-toolbar button[data-command='link']) {
  display: none !important;
}

/* Alternative selectors if the above doesn't work */
.ink-mde-wrapper :deep(.ink-mde-toolbar [aria-label*='image' i]),
.ink-mde-wrapper :deep(.ink-mde-toolbar [aria-label*='link' i]),
.ink-mde-wrapper :deep(.ink-mde-toolbar [title*='image' i]),
.ink-mde-wrapper :deep(.ink-mde-toolbar [title*='link' i]) {
  display: none !important;
}

/* Dark mode support */
:deep(.dark) .ink-mde-wrapper {
  border-color: var(--p-surface-border);
}

@media (prefers-color-scheme: dark) {
  .ink-mde-wrapper {
    --ink-color: #e4e4e7;
    --ink-block-background-color: #1e1e22;
    --ink-block-background-color-on-hover: #252529;
    --ink-syntax-comment-color: #a1a1aa;
    --ink-syntax-meta-color: #a1a1aa;
    --ink-syntax-punctuation-color: #d4d4d8;
    --ink-syntax-heading-color: #ffffff;
    --ink-syntax-heading1-color: #ffffff;
    --ink-syntax-heading2-color: #ffffff;
    --ink-syntax-heading3-color: #ffffff;
    --ink-syntax-heading4-color: #ffffff;
    --ink-syntax-heading5-color: #ffffff;
    --ink-syntax-heading6-color: #ffffff;
    --ink-syntax-link-color: #93c5fd;
    --ink-syntax-url-color: #93c5fd;
    --ink-syntax-string-color: #86efac;
    --ink-syntax-keyword-color: #c4b5fd;
  }
}
</style>
