<template>
  <div class="relative flex h-full overflow-hidden bg-surface-50 dark:bg-surface-900">
    <!-- Mobile backdrop -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      leave-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isMobileSidebarOpen"
        class="absolute inset-0 z-30 bg-black/50 md:hidden"
        @click="isMobileSidebarOpen = false"
      />
    </Transition>

    <!-- Left Sidebar: Tree View -->
    <div
      :class="[
        'absolute top-0 left-0 bottom-0 z-40 flex w-80 flex-col border-r border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-800',
        'transition-transform duration-300 ease-in-out',
        'md:relative md:z-auto md:translate-x-0',
        isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      ]"
    >
      <!-- Header -->
      <div
        class="flex h-16 shrink-0 items-center justify-between border-b border-surface-200 px-4 dark:border-surface-700"
      >
        <h2 class="text-lg font-semibold text-surface-900 dark:text-surface-0">
          {{ $t('Wiki.title') || 'Wiki' }}
        </h2>
        <!-- Close button (mobile only) -->
        <Button
          severity="secondary"
          text
          class="h-10 w-10 md:hidden"
          @click="isMobileSidebarOpen = false"
          :title="$t('Wiki.closeSidebar') || 'Close navigation'"
        >
          <IconClose class="h-6 w-6" />
        </Button>
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
    <div class="flex min-w-0 flex-1 flex-col">
      <!-- Mobile top bar (always visible on mobile) -->
      <div
        class="flex h-14 shrink-0 items-center gap-3 border-b border-surface-200 bg-white px-3 dark:border-surface-700 dark:bg-surface-800 md:hidden"
      >
        <button
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded text-surface-600 dark:text-surface-300"
          @click="isMobileSidebarOpen = true"
          :title="$t('Wiki.openSidebar') || 'Open navigation'"
        >
          <IconMenu class="h-6 w-6" />
        </button>
        <span
          v-if="store.selectedText"
          class="min-w-0 flex-1 truncate text-sm font-medium text-surface-900 dark:text-surface-0"
        >
          {{ store.selectedText.title }}
        </span>
        <span v-else class="text-sm text-surface-500 dark:text-surface-400">
          {{ $t('Wiki.title') || 'Wiki' }}
        </span>
        <!-- Mobile action buttons (compact) when entry is selected -->
        <div v-if="store.selectedText" class="flex shrink-0 items-center gap-1">
          <!-- Auto-save checkbox (mobile) -->
          <label class="flex cursor-pointer items-center gap-1.5 text-xs text-surface-600 dark:text-surface-300 mr-1" :title="$t('Wiki.autoSaveHint')">
            <Checkbox
              :model-value="autoSave"
              binary
              @update:model-value="toggleAutoSave"
              :pt="{ root: { class: 'scale-90' } }"
            />
            <span class="select-none">{{ $t('Wiki.autoSave') }}</span>
          </label>
          <slot
            name="toolbar-actions"
            :selected-text="store.selectedText"
            :tenant-id="tenantId"
            :edit-text="editText"
          />
          <!-- Add sub-page -->
          <Button
            severity="success"
            size="small"
            outlined
            class="h-8 w-8"
            @click="handleAddChild(store.selectedText!.id, store.selectedText!.tenantWide)"
            :disabled="store.loading"
            :title="$t('Wiki.addChild') || 'Add sub-page'"
          >
            <IconAdd class="h-3.5 w-3.5" />
          </Button>
          <!-- Move one level up (only if not already at root) -->
          <Button
            v-if="store.selectedText.parentId"
            severity="secondary"
            size="small"
            outlined
            class="h-8 w-8"
            @click="handleMoveUp"
            :disabled="store.loading"
            :title="$t('Wiki.moveUp') || 'Move one level up'"
          >
            <IconLevelUp class="h-3.5 w-3.5" />
          </Button>
          <Button
            severity="success"
            size="small"
            outlined
            class="h-8 w-8"
            @click="handleSmartEdit"
            :disabled="store.loading"
            :title="$t('Wiki.smartEdit') || 'Smart Edit'"
          >
            <IconMagic class="h-3.5 w-3.5" />
          </Button>
          <Button
            severity="danger"
            size="small"
            outlined
            class="h-8 w-8"
            @click="handleDeleteCurrent"
            :disabled="store.loading"
            :title="$t('Wiki.delete') || 'Delete'"
          >
            <IconDelete class="h-3.5 w-3.5" />
          </Button>
          <Button
            severity="secondary"
            size="small"
            outlined
            class="h-8 w-8"
            @click="handleSave"
            :disabled="store.loading"
            :title="$t('Common.save') || 'Save'"
          >
            <IconSave class="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <!-- Desktop Editor Header (hidden on mobile) -->
      <div
        v-if="store.selectedText"
        class="hidden h-16 shrink-0 items-center justify-between border-b border-surface-200 bg-white px-6 dark:border-surface-700 dark:bg-surface-800 md:flex"
      >
        <div class="mr-4 min-w-0 flex-1">
          <input
            v-model="editTitle"
            type="text"
            class="w-full border-none bg-transparent text-2xl font-semibold text-surface-900 outline-none dark:text-surface-0"
            :placeholder="$t('Wiki.titlePlaceholder') || 'Enter title...'"
            @blur="handleSaveTitle"
          />
        </div>
        <div class="flex items-center gap-2">
          <!-- Auto-save checkbox -->
          <label class="flex cursor-pointer items-center gap-1.5 text-xs text-surface-600 dark:text-surface-300" :title="$t('Wiki.autoSaveHint')">
            <Checkbox
              :model-value="autoSave"
              binary
              @update:model-value="toggleAutoSave"
            />
            <span class="select-none">{{ $t('Wiki.autoSave') }}</span>
          </label>
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

      <!-- Mobile title input (shown below mobile top bar when entry selected) -->
      <div
        v-if="store.selectedText"
        class="shrink-0 border-b border-surface-200 bg-white px-4 py-2 dark:border-surface-700 dark:bg-surface-800 md:hidden"
      >
        <input
          v-model="editTitle"
          type="text"
          class="w-full border-none bg-transparent text-xl font-semibold text-surface-900 outline-none dark:text-surface-0"
          :placeholder="$t('Wiki.titlePlaceholder') || 'Enter title...'"
          @blur="handleSaveTitle"
        />
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
        <div v-else-if="store.selectedText" class="h-full p-4 md:p-6">
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
            <!-- Mobile: button to open sidebar in empty state -->
            <Button
              class="mt-4 md:hidden"
              severity="secondary"
              outlined
              @click="isMobileSidebarOpen = true"
            >
              <IconMenu class="mr-2 h-4 w-4" />
              {{ $t('Wiki.openSidebar') || 'Open navigation' }}
            </Button>
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
import { ref, computed, watch, onUnmounted } from 'vue'
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
import IconMenu from '~icons/line-md/list-3-filled'
import IconClose from '~icons/line-md/close'
import IconLevelUp from '~icons/line-md/arrow-up'

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
const isMobileSidebarOpen = ref(false)

// Auto-save state – persisted in localStorage
const autoSave = ref(localStorage.getItem('wiki-auto-save') === 'true')

let autoSaveInterval: ReturnType<typeof setInterval> | null = null

const AUTO_SAVE_INTERVAL_MS = 15 * 60 * 1000

function startAutoSaveInterval() {
  stopAutoSaveInterval()
  autoSaveInterval = setInterval(() => {
    if (store.selectedText && props.tenantId) {
      handleSave()
    }
  }, AUTO_SAVE_INTERVAL_MS)
}

function stopAutoSaveInterval() {
  if (autoSaveInterval !== null) {
    clearInterval(autoSaveInterval)
    autoSaveInterval = null
  }
}

function toggleAutoSave(value: boolean) {
  autoSave.value = value
  localStorage.setItem('wiki-auto-save', String(value))
  if (value) {
    startAutoSaveInterval()
  } else {
    stopAutoSaveInterval()
  }
}

// Start interval if auto-save was already enabled
if (autoSave.value) {
  startAutoSaveInterval()
}

onUnmounted(() => {
  stopAutoSaveInterval()
})

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

// Watch for selected text changes – auto-save previous entry on page switch
watch(
  () => store.selectedText,
  async (newText, oldText) => {
    if (autoSave.value && oldText && props.tenantId) {
      await store.updateText(props.tenantId, oldText.id, {
        title: editTitle.value,
        text: editText.value,
      })
    }
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
  // Close sidebar on mobile after selecting an entry
  isMobileSidebarOpen.value = false
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

// Find the parentId of a given node id within a tree
const findParentId = (nodes: typeof store.personalTreeData, targetId: string, currentParentId: string | null = null): string | null | undefined => {
  for (const node of nodes) {
    if (node.id === targetId) return currentParentId
    if (node.children?.length) {
      const found = findParentId(node.children, targetId, node.id)
      if (found !== undefined) return found
    }
  }
  return undefined
}

// Handle move one level up (mobile toolbar action)
const handleMoveUp = () => {
  if (!props.tenantId || !store.selectedText) return
  const treeData = store.selectedText.tenantWide ? store.companyTreeData : store.personalTreeData
  // Find the grandparent id (parent of the current parent)
  const grandParentId = findParentId(treeData, store.selectedText.parentId!)
  handleMove({
    itemId: store.selectedText.id,
    newParentId: grandParentId ?? null,
    targetTenantWide: store.selectedText.tenantWide,
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

// Save before leaving the wiki view (e.g. route change) when auto-save is enabled
async function saveBeforeLeave() {
  if (autoSave.value && store.selectedText && props.tenantId) {
    await store.updateText(props.tenantId, store.selectedText.id, {
      title: editTitle.value,
      text: editText.value,
    })
  }
}

// Expose store and state for parent components to use
defineExpose({
  store,
  editText,
  editTitle,
  saveBeforeLeave,
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
