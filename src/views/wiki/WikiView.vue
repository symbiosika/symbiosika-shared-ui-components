<template>
  <div class="flex h-full bg-surface-50 dark:bg-surface-900">
    <!-- Left Sidebar: Tree View -->
    <div
      class="flex w-80 flex-col border-r border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800"
    >
      <!-- Header -->
      <div
        class="flex h-16 items-center justify-between border-b border-surface-200 px-4 dark:border-surface-700"
      >
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0">
          {{ $t('Wiki.title') || 'Wiki' }}
        </h2>
      </div>

      <!-- Tree Container -->
      <div class="flex-1 overflow-y-auto p-3">
        <!-- Personal Knowledge Section -->
        <div class="mb-6">
          <div class="mb-2 flex items-center justify-between">
            <div class="flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-300">
              <IconUser class="h-4 w-4" />
              <span>{{ $t('Wiki.personal') || 'Personal' }}</span>
            </div>
            <Button
              severity="success"
              size="small"
              text
              class="h-8 w-8"
              @click="handleAddRoot(false)"
              :disabled="!tenantId"
              :title="$t('Wiki.addPersonalEntry') || 'Add personal entry'"
            >
              <IconAdd class="h-4 w-4" />
            </Button>
          </div>
          <WikiTree
            :items="store.personalTreeData"
            :selected-id="store.selectedText?.id || null"
            :is-tenant-wide="false"
            @select="handleSelectText"
            @add-child="(id) => handleAddChild(id, false)"
            @edit="handleEdit"
            @delete="handleDelete"
            @move="handleMove"
          />
        </div>

        <!-- Company Knowledge Section -->
        <div v-if="showCompanySection">
          <div class="mb-2 flex items-center justify-between">
            <div class="flex items-center gap-2 text-sm font-semibold text-surface-700 dark:text-surface-300">
              <IconCompany class="h-4 w-4" />
              <span>{{ $t('Wiki.company') || 'Company' }}</span>
            </div>
            <Button
              severity="success"
              size="small"
              text
              class="h-8 w-8"
              @click="handleAddRoot(true)"
              :disabled="!tenantId"
              :title="$t('Wiki.addCompanyEntry') || 'Add company entry'"
            >
              <IconAdd class="h-4 w-4" />
            </Button>
          </div>
          <WikiTree
            :items="store.companyTreeData"
            :selected-id="store.selectedText?.id || null"
            :is-tenant-wide="true"
            @select="handleSelectText"
            @add-child="(id) => handleAddChild(id, true)"
            @edit="handleEdit"
            @delete="handleDelete"
            @move="handleMove"
          />
        </div>
      </div>
    </div>

    <!-- Right Side: Editor -->
    <div class="flex flex-1 flex-col">
      <!-- Editor Header -->
      <div
        v-if="store.selectedText"
        class="flex h-16 items-center justify-between border-b border-surface-200 bg-white px-6 dark:border-surface-700 dark:bg-surface-800"
      >
        <div class="flex-1 min-w-0 mr-4">
          <input
            v-model="editTitle"
            type="text"
            class="w-full border-none bg-transparent text-2xl font-semibold text-surface-900 outline-none dark:text-surface-0"
            :placeholder="$t('Wiki.titlePlaceholder') || 'Enter title...'"
            @blur="handleSaveTitle"
          />
        </div>
        <div class="flex items-center gap-2">
          <!-- Slot for app-specific toolbar actions (e.g. Digital Twin buttons) -->
          <slot
            name="toolbar-actions"
            :selected-text="store.selectedText"
            :tenant-id="tenantId"
            :edit-text="editText"
          />
          <Button
            severity="info"
            size="small"
            outlined
            class="h-9 w-9"
            @click="handleCopyWikiLink"
            :disabled="store.loading || !store.selectedText"
            :title="$t('Wiki.copyLink') || 'Copy Wiki Link'"
          >
            <IconLink class="h-4 w-4" />
          </Button>
          <Button
            severity="success"
            size="small"
            outlined
            class="h-9 w-9"
            @click="handleSmartEdit"
            :disabled="store.loading || !store.selectedText"
            :title="$t('Wiki.smartEdit') || 'Smart Edit'"
          >
            <IconMagic class="h-4 w-4" />
          </Button>
          <Button
            severity="danger"
            size="small"
            outlined
            class="h-9 w-9"
            @click="handleDeleteCurrent"
            :disabled="store.loading"
            :title="$t('Wiki.delete') || 'Delete'"
          >
            <IconDelete class="h-4 w-4" />
          </Button>
          <Button
            severity="secondary"
            size="small"
            outlined
            class="h-9 w-9"
            @click="handleSave"
            :disabled="store.loading"
            :title="$t('Common.save') || 'Save'"
          >
            <IconSave class="h-4 w-4" />
          </Button>
        </div>
      </div>

      <!-- Editor Content -->
      <div class="flex-1 overflow-y-auto bg-white dark:bg-surface-800">
        <!-- Loading State -->
        <div
          v-if="store.loadingText"
          class="flex h-full items-center justify-center text-surface-500 dark:text-surface-400"
        >
          <div class="text-center">
            <ProgressSpinner
              style="width: 50px; height: 50px"
              strokeWidth="4"
              animationDuration="1s"
            />
            <p class="mt-4 text-lg">
              {{ $t('Wiki.loadingContent') || 'Loading...' }}
            </p>
          </div>
        </div>
        <!-- Editor -->
        <div v-else-if="store.selectedText" class="h-full p-6">
          <MarkdownEditor
            v-model="editText"
            :placeholder="$t('Wiki.contentPlaceholder') || 'Start writing...'"
            height="100%"
          />
        </div>
        <!-- Empty State -->
        <div
          v-else
          class="flex h-full items-center justify-center text-surface-500 dark:text-surface-400"
        >
          <div class="text-center">
            <IconDocument class="mx-auto mb-4 h-16 w-16 opacity-50" />
            <p class="text-lg">
              {{ $t('Wiki.selectEntry') || 'Select an entry to view or edit' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Smart Edit Dialog -->
    <SmartEditDialog
      v-model:visible="showSmartEditDialog"
      :entry-id="store.selectedText?.id || null"
      :tenant-id="tenantId || null"
      @changes-applied="handleChangesApplied"
    >
      <!-- Forward the transcription slot from parent -->
      <template #transcription="{ onTranscription }">
        <slot name="smart-edit-transcription" :on-transcription="onTranscription" />
      </template>
    </SmartEditDialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useToast } from 'primevue/usetoast'
import { useKnowledgeTextsStore } from '@shared/stores/knowledgeTexts'
import WikiTree from '@shared/components/wiki/WikiTree.vue'
import MarkdownEditor from '@shared/components/knowledge/MarkdownEditor.vue'
import SmartEditDialog from '@shared/components/wiki/SmartEditDialog.vue'
import IconAdd from '~icons/line-md/plus'
import IconSave from '~icons/line-md/clipboard-check'
import IconDocument from '~icons/line-md/file-document'
import IconDelete from '~icons/line-md/trash'
import IconLink from '~icons/line-md/link'
import IconMagic from '~icons/line-md/edit'
import IconUser from '~icons/line-md/account'
import IconCompany from '~icons/line-md/home'

const props = withDefaults(defineProps<{
  tenantId: string | undefined
  userId: string | null | undefined
  showCompanySection?: boolean
}>(), {
  showCompanySection: false,
})

const store = useKnowledgeTextsStore()
const toast = useToast()
const { t } = useI18n()

const editTitle = ref('')
const editText = ref('')
const showSmartEditDialog = ref(false)

// Watch for tenant change
watch(
  () => props.tenantId,
  async (newTenantId) => {
    if (newTenantId) {
      await store.fetchTexts(newTenantId)
    }
  },
  { immediate: true },
)

// Watch for selected text changes
watch(
  () => store.selectedText,
  (newText) => {
    if (newText) {
      editTitle.value = newText.title
      if (newText.text !== undefined) {
        editText.value = newText.text
      }
    } else {
      editTitle.value = ''
      editText.value = ''
    }
  },
  { immediate: true },
)

// Handle add root entry
const handleAddRoot = async (isTenantWide: boolean = true) => {
  if (!props.tenantId) return

  // If an entry is selected, create a child under it
  if (store.selectedText) {
    return handleAddChild(store.selectedText.id, isTenantWide)
  }

  const newText = await store.createText(
    props.tenantId, 
    {
      title: 'New Entry',
      text: '',
      parentId: null,
    },
    isTenantWide,
    props.userId,
  )

  if (newText) {
    await store.selectText(newText.id, props.tenantId)
  }
}

// Handle add child entry
const handleAddChild = async (parentId: string, isTenantWide: boolean = true) => {
  if (!props.tenantId) return

  const newText = await store.createText(
    props.tenantId,
    {
      title: 'New Entry',
      text: '',
      parentId,
    },
    isTenantWide,
    props.userId,
  )

  if (newText) {
    await store.selectText(newText.id, props.tenantId)
  }
}

// Handle select text
const handleSelectText = async (id: string) => {
  if (!props.tenantId) return
  await store.selectText(id, props.tenantId)
}

// Handle edit (same as select for now)
const handleEdit = (id: string) => {
  handleSelectText(id)
}

// Handle delete
const handleDelete = async (id: string) => {
  if (!props.tenantId) return
  await store.deleteText(props.tenantId, id)
}

// Handle delete current entry
const handleDeleteCurrent = async () => {
  if (!props.tenantId || !store.selectedText) return
  await store.deleteText(props.tenantId, store.selectedText.id)
}

// Handle save title
const handleSaveTitle = async () => {
  if (!props.tenantId || !store.selectedText) return

  if (editTitle.value !== store.selectedText.title) {
    await store.updateText(props.tenantId, store.selectedText.id, {
      title: editTitle.value,
    })
  }
}

// Handle save content
const handleSave = async () => {
  if (!props.tenantId || !store.selectedText) return

  await store.updateText(props.tenantId, store.selectedText.id, {
    title: editTitle.value,
    text: editText.value,
  })
}

// Handle move entry via drag & drop
const handleMove = (data: { itemId: string; newParentId: string | null; targetTenantWide: boolean }) => {
  if (!props.tenantId) return
  if (data.targetTenantWide) {
    store.moveText(props.tenantId, data.itemId, data.newParentId, data.targetTenantWide, null)
  } else {
    store.moveText(props.tenantId, data.itemId, data.newParentId, data.targetTenantWide, props.userId ?? undefined)
  }
}

// Handle copy wiki link
const handleCopyWikiLink = async () => {
  if (!props.tenantId || !store.selectedText) return

  const baseUrl = window.location.origin
  const wikiLink = `${baseUrl}/api/v1/tenant/${props.tenantId}/knowledge-wiki/${store.selectedText.id}?type=json`

  try {
    await navigator.clipboard.writeText(wikiLink)
    toast.add({
      severity: 'success',
      summary: t('Wiki.linkCopied') || 'Link copied',
      detail: t('Wiki.linkCopiedDetail') || 'Wiki link copied to clipboard',
      life: 3000,
    })
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: t('Wiki.linkCopyError') || 'Error copying link',
      detail: t('Wiki.linkCopyErrorDetail') || 'Failed to copy link to clipboard',
      life: 3000,
    })
  }
}

// Handle smart edit
const handleSmartEdit = () => {
  showSmartEditDialog.value = true
}

// Handle changes applied from smart edit
const handleChangesApplied = async () => {
  if (!props.tenantId || !store.selectedText) return
  await store.selectText(store.selectedText.id, props.tenantId)
}

// Expose store and state for parent components to use
defineExpose({
  store,
  editText,
  editTitle,
})
</script>

<style scoped>
/* Remove default input styles */
input[type='text'] {
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

input[type='text']:focus {
  outline: none;
}
</style>
