<template>
  <Dialog
    v-model:visible="isVisible"
    modal
    :header="$t('Wiki.SmartEdit.title')"
    :style="{ width: '50rem' }"
    :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
  >
    <div class="space-y-6">
      <!-- Description -->
      <p class="text-sm text-gray-600 dark:text-gray-400">
        {{ $t('Wiki.SmartEdit.description') }}
      </p>

      <!-- Step 1: Input or Transcription -->
      <div v-if="step === 'input'" class="space-y-4">
        <!-- Slot for app-specific transcription recorder -->
        <slot name="transcription" :on-transcription="handleTranscriptionComplete" />

        <!-- Text Input -->
        <div class="space-y-2">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ $t('Wiki.SmartEdit.inputPlaceholder') }}
          </label>
          <Textarea
            v-model="userInput"
            :placeholder="$t('Wiki.SmartEdit.inputPlaceholder')"
            rows="6"
            class="w-full"
          />
        </div>

        <!-- Analyze Button -->
        <div class="flex justify-end gap-2">
          <Button
            :label="$t('Wiki.SmartEdit.cancel')"
            severity="secondary"
            outlined
            @click="handleClose"
          />
          <Button
            :label="$t('Wiki.SmartEdit.analyze')"
            :loading="isAnalyzing"
            :disabled="!userInput || isAnalyzing"
            @click="handleAnalyze"
          />
        </div>
      </div>

      <!-- Step 2: Review Edit Operations -->
      <div v-else-if="step === 'review'" class="space-y-4">
        <div
          class="max-h-96 overflow-y-auto rounded-lg border border-surface-200 p-4 dark:border-surface-700"
        >
          <EditOperationsList :edits="editOperations" />
        </div>

        <!-- Apply/Cancel Buttons -->
        <div class="flex justify-end gap-2">
          <Button
            :label="$t('Wiki.SmartEdit.cancel')"
            severity="secondary"
            outlined
            @click="handleBack"
          />
          <Button
            :label="$t('Wiki.SmartEdit.apply')"
            :loading="isApplying"
            :disabled="editOperations.length === 0 || isApplying"
            @click="handleApply"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import EditOperationsList, {
  type EditOperation,
} from '@shared/components/wiki/EditOperationsList.vue'
import { fetcher } from '@shared/utils/fetcher'
import { useToast } from 'primevue/usetoast'
import { useI18n } from 'vue-i18n'

interface Props {
  visible: boolean
  entryId: string | null
  tenantId: string | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'changes-applied'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { t } = useI18n()
const toast = useToast()

const isVisible = computed({
  get: () => props.visible,
  set: (value) => emit('update:visible', value),
})

const step = ref<'input' | 'review'>('input')
const userInput = ref('')
const editOperations = ref<EditOperation[]>([])
const isAnalyzing = ref(false)
const isApplying = ref(false)

const handleTranscriptionComplete = (text: string) => {
  userInput.value = text
}

const handleAnalyze = async () => {
  if (!props.entryId || !userInput.value || !props.tenantId) return

  isAnalyzing.value = true

  try {
    const response = await fetcher.post<{ edits: EditOperation[] }>(
      `/api/v1/tenant/${props.tenantId}/knowledge-text-merge/analyze`,
      {
        entryId: props.entryId,
        userInput: userInput.value,
      }
    )

    editOperations.value = response.edits
    step.value = 'review'
  } catch (error) {
    console.error('Error analyzing changes:', error)
    toast.add({
      severity: 'error',
      summary: t('Wiki.SmartEdit.errorAnalyzing'),
      detail: error instanceof Error ? error.message : String(error),
      life: 5000,
    })
  } finally {
    isAnalyzing.value = false
  }
}

const handleApply = async () => {
  if (!props.entryId || editOperations.value.length === 0 || !props.tenantId) return

  isApplying.value = true

  try {
    await fetcher.post(
      `/api/v1/tenant/${props.tenantId}/knowledge-text-merge/apply`,
      {
        entryId: props.entryId,
        edits: editOperations.value,
      }
    )

    toast.add({
      severity: 'success',
      summary: t('Wiki.SmartEdit.success'),
      life: 3000,
    })

    emit('changes-applied')
    handleClose()
  } catch (error) {
    console.error('Error applying changes:', error)
    toast.add({
      severity: 'error',
      summary: t('Wiki.SmartEdit.errorApplying'),
      detail: error instanceof Error ? error.message : String(error),
      life: 5000,
    })
  } finally {
    isApplying.value = false
  }
}

const handleBack = () => {
  step.value = 'input'
  editOperations.value = []
}

const handleClose = () => {
  isVisible.value = false
  // Reset state
  setTimeout(() => {
    step.value = 'input'
    userInput.value = ''
    editOperations.value = []
  }, 300)
}
</script>
