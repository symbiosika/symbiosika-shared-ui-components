# Shared Frontend Package

Shared Vue components, stores, views, types, utils and locales used across multiple apps.
Lives as a git submodule at `frontend/shared/` in each app.

## Structure

```
shared/src/
  components/    # Shared Vue components (wiki, knowledge, ...)
  stores/        # Shared Pinia stores
  views/         # Shared views (with slots for app-specific extensions)
  types/         # Shared TypeScript types
  utils/         # Shared utilities (fetcher, ...)
  locales/       # Shared i18n locale files (en/, de/)
```

## Rules

- Shared code MUST NOT import from `@/` (app-specific paths). Only use `@shared/` or relative imports.
- App-specific dependencies (stores, composables) must be injected via props, slots, or provide/inject.
- All imports from shared code use the `@shared/` alias, e.g. `import { fetcher } from '@shared/utils/fetcher'`.
- Volt components (PrimeVue) are installed in each app and available via auto-import. Shared code can use them directly.
- Icons must be imported explicitly: `import IconName from '~icons/line-md/icon-name'`.

## Integration in a new app

### 1. Add submodule

```bash
cd frontend/
git submodule add <shared-repo-url> shared
```

### 2. Vite config (`vite.config.ts`)

Add the `@shared` resolve alias:

```typescript
resolve: {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
    '@shared': fileURLToPath(new URL('./shared/src', import.meta.url)),
  },
},
```

### 3. TypeScript config (`tsconfig.app.json`)

Add path alias and include shared sources:

```json
{
  "include": ["env.d.ts", "src/**/*", "src/**/*.vue", "shared/src/**/*", "shared/src/**/*.vue"],
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@shared/*": ["./shared/src/*"]
    }
  }
}
```

### 4. Tailwind CSS (`src/assets/base.css`)

Add source directive so Tailwind scans shared Vue files:

```css
@import 'tailwindcss';
@import 'tailwindcss-primeui';

@source "../../shared/src/**/*.vue";
```

### 5. i18n (`src/i18n.ts`)

Load shared locale files and deep-merge with app locales (app overrides shared):

```typescript
function loadSharedMessages(): Record<string, Messages> {
  const localeModules = import.meta.glob('../shared/src/locales/**/*.json', {
    eager: true,
  }) as Record<string, { default: Record<string, any> } | Record<string, any>>
  return localeModules
}
```

The `parsePath` regex must match both app and shared locale paths:

```typescript
const match = path.match(/locales\/([^/]+)\/(.+)\.json$/)
```

Merge order: shared first, then app (app keys override shared keys):

```typescript
const sharedMessages = buildMessages(loadSharedMessages())
const appMessages = buildMessages(loadLocalMessages())
const messages = deepMerge(sharedMessages, appMessages)
```

## Code patterns

### Using a shared store

```typescript
import { useKnowledgeTextsStore } from '@shared/stores/knowledgeTexts'

const store = useKnowledgeTextsStore()
await store.fetchTexts(tenantId)
```

### Using a shared type

```typescript
import type { KnowledgeText } from '@shared/types/knowledge'
```

### Using the shared fetcher

```typescript
import { fetcher } from '@shared/utils/fetcher'

const data = await fetcher.get<MyType>('/api/v1/...')
```

### Re-exporting in the app (for backward compat)

If app code already imports from `@/utils/fetcher` or `@/stores/knowledgeTexts`, create a re-export file in the app:

```typescript
// src/utils/fetcher.ts
export { fetcher, API_BASE_URL } from '@shared/utils/fetcher'
```

```typescript
// src/stores/knowledgeTexts.ts
export { useKnowledgeTextsStore, type KnowledgeText } from '@shared/stores/knowledgeTexts'
```

### Using the shared Wiki view with app-specific slots

The shared `WikiView` component accepts props and exposes slots for app-specific extensions:

```vue
<template>
  <WikiView
    :tenant-id="tenantId"
    :user-id="userId"
    :show-company-section="false"
  >
    <!-- Inject app-specific toolbar buttons -->
    <template #toolbar-actions="{ selectedText, tenantId, editText }">
      <Button @click="doSomething(selectedText)">Custom Action</Button>
    </template>

    <!-- Inject app-specific transcription recorder into Smart Edit dialog -->
    <template #smart-edit-transcription="{ onTranscription }">
      <TranscriptionRecorder
        :show-result="false"
        @transcription-complete="onTranscription"
      />
    </template>
  </WikiView>
</template>

<script setup lang="ts">
import WikiView from '@shared/views/wiki/WikiView.vue'
</script>
```

WikiView props:
- `tenantId: string | undefined` -- current tenant ID
- `userId: string | null | undefined` -- current user ID
- `showCompanySection: boolean` (default: false) -- show company knowledge tree

WikiView slots:
- `#toolbar-actions` -- slot props: `{ selectedText, tenantId, editText }`
- `#smart-edit-transcription` -- slot props: `{ onTranscription }` (callback for transcription text)

### Adding shared i18n keys

Place locale files in `shared/src/locales/<lang>/<Namespace>.json`.
Apps can override individual keys by having the same namespace file in `src/locales/<lang>/<Namespace>.json`.

### Adding a new shared component

1. Create the component in `shared/src/components/<feature>/MyComponent.vue`
2. Use only `@shared/` imports inside the component
3. Import it explicitly in shared views or export it for app use
4. Apps import via `import MyComponent from '@shared/components/<feature>/MyComponent.vue'`
