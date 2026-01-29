<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { refDebounced } from '@vueuse/core'
import type { Pagination, User } from '@/types/api'

type LoadResult = {
  items: User[]
  pagination: Pagination
}

type Props = {
  label: string
  placeholder: string
  modelValue: User | null
  loadOptions: (search: string, page: number) => Promise<LoadResult | null>
  disabled?: boolean
  required?: boolean
  searchPlaceholder?: string
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  required: false,
  searchPlaceholder: 'Search users',
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: User | null): void
}>()

const rootRef = ref<HTMLElement | null>(null)
const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLDivElement | null>(null)
const isOpen = ref(false)
const isLoading = ref(false)
const error = ref<string | null>(null)
const options = ref<User[]>([])
const pagination = ref<Pagination | null>(null)
const search = ref('')
const activeIndex = ref(-1)
const debouncedSearch = refDebounced(search, 300)
const currentPage = ref(1)
const isDropUp = ref(false)

const canLoadMore = computed(() => {
  if (!pagination.value) {
    return false
  }
  return pagination.value.currentPage < pagination.value.totalPages
})

const listboxId = `async-select-${Math.random().toString(36).slice(2)}`

const resetState = () => {
  options.value = []
  pagination.value = null
  currentPage.value = 1
  activeIndex.value = -1
}

const open = async () => {
  if (props.disabled) {
    return
  }
  isOpen.value = true
  await nextTick()
  updateDropdownPlacement()
  inputRef.value?.focus()
  await fetchOptions(1, false)
}

const close = () => {
  isOpen.value = false
  search.value = ''
  resetState()
}

const toggle = async () => {
  if (isOpen.value) {
    close()
    return
  }
  await open()
}

const fetchOptions = async (page: number, append: boolean) => {
  isLoading.value = true
  error.value = null
  try {
    const result = await props.loadOptions(search.value.trim(), page)
    if (!result) {
      return
    }
    options.value = append ? [...options.value, ...result.items] : result.items
    pagination.value = result.pagination
    currentPage.value = result.pagination.currentPage
  } catch (err: unknown) {
    if (err instanceof Error) {
      error.value = err.message
    } else {
      error.value = 'An unknown error occurred'
    }
  } finally {
    isLoading.value = false
  }
}

const loadMore = async () => {
  if (!canLoadMore.value) {
    return
  }
  await fetchOptions(currentPage.value + 1, true)
}

const selectOption = (option: User) => {
  emit('update:modelValue', option)
  close()
}

const handleOutsideClick = (event: MouseEvent) => {
  const target = event.target as Node
  if (rootRef.value && !rootRef.value.contains(target)) {
    close()
  }
}

const updateDropdownPlacement = () => {
  if (!rootRef.value || !dropdownRef.value) {
    return
  }
  const triggerRect = rootRef.value.getBoundingClientRect()
  const dropdownHeight = dropdownRef.value.offsetHeight || 280
  const viewportHeight = window.innerHeight
  const spaceBelow = viewportHeight - triggerRect.bottom
  const spaceAbove = triggerRect.top

  if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
    isDropUp.value = true
  } else {
    isDropUp.value = false
  }
}

const handleKeydown = async (event: KeyboardEvent) => {
  if (!isOpen.value && (event.key === 'ArrowDown' || event.key === 'Enter')) {
    event.preventDefault()
    await open()
    return
  }

  if (!isOpen.value) {
    return
  }

  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, options.value.length - 1)
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  }

  if (event.key === 'Enter' && activeIndex.value >= 0) {
    event.preventDefault()
    const option = options.value[activeIndex.value]
    if (option) {
      selectOption(option)
    }
  }
}

watch(debouncedSearch, () => {
  if (!isOpen.value) {
    return
  }
  fetchOptions(1, false)
})

onMounted(() => {
  document.addEventListener('click', handleOutsideClick)
  window.addEventListener('resize', updateDropdownPlacement)
  window.addEventListener('scroll', updateDropdownPlacement, true)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleOutsideClick)
  window.removeEventListener('resize', updateDropdownPlacement)
  window.removeEventListener('scroll', updateDropdownPlacement, true)
})
</script>

<template>
  <div ref="rootRef" class="async-select" @keydown="handleKeydown">
    <label for="async-select-input" class="async-select__label">
      <span>{{ props.label }}</span>
      <span v-if="props.required" class="async-select__required">*</span>
    </label>
    <button
      id="async-select-input"
      class="async-select__control"
      type="button"
      :name="props.label"
      :disabled="props.disabled"
      :aria-expanded="isOpen"
      aria-haspopup="listbox"
      :aria-controls="listboxId"
      :aria-label="props.label"
      @click="toggle"
    >
      <span v-if="props.modelValue" class="async-select__value">
        {{ props.modelValue.fullName }}
      </span>
      <span v-else class="async-select__placeholder">{{ props.placeholder }}</span>
      <span class="async-select__chevron" aria-hidden="true">▾</span>
    </button>

    <div v-if="isOpen" class="async-select__dropdown" @click.stop>
      <input
        ref="inputRef"
        v-model="search"
        class="async-select__search"
        type="text"
        :aria-label="props.searchPlaceholder"
        :placeholder="props.searchPlaceholder"
      />

      <div :id="listboxId" class="async-select__list" role="listbox">
        <button
          v-for="(option, index) in options"
          :key="option.id"
          type="button"
          class="async-select__option"
          :class="{ 'is-active': index === activeIndex }"
          @mouseenter="activeIndex = index"
          @click="selectOption(option)"
        >
          <span class="async-select__option-name">{{ option.fullName }}</span>
          <span class="async-select__option-email">{{ option.email }}</span>
        </button>

        <div v-if="!options.length && !isLoading" class="async-select__empty">
          No results found.
        </div>
        <div v-if="isLoading" class="async-select__loading">Loading...</div>
      </div>

      <button
        v-if="canLoadMore"
        type="button"
        class="async-select__load-more"
        :disabled="isLoading"
        @click="loadMore"
      >
        {{ isLoading ? 'Loading...' : 'Load more' }}
      </button>

      <div v-if="error" class="async-select__error">{{ error }}</div>
    </div>
  </div>
</template>

<style scoped>
.async-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  width: 356px;
}

.async-select__label {
  color: var(--color-text-muted);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.async-select__required {
  color: var(--color-danger);
  margin-left: 4px;
}

.async-select__control {
  align-items: center;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  color: var(--color-text-primary);
  cursor: pointer;
  display: inline-flex;
  gap: 8px;
  justify-content: space-between;
  min-height: 44px;
  padding: 10px 12px;
  text-align: left;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.async-select__control:focus-visible {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus);
  outline: none;
}

.async-select__control:disabled {
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.async-select__placeholder {
  color: var(--color-text-muted);
}

.async-select__chevron {
  color: var(--color-text-muted);
  font-size: 12px;
}

.async-select__dropdown {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.12);
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
  padding: 10px;
  position: absolute;
  top: 100%;
  width: 100%;
  z-index: 20;
}

.async-select__search {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 13px;
  padding: 8px 10px;
}

.async-select__search:focus-visible {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus);
  outline: none;
}

.async-select__list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 220px;
  overflow-y: auto;
}

.async-select__option {
  align-items: flex-start;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
  text-align: left;
  transition: background 0.2s ease;
}

.async-select__option.is-active,
.async-select__option:hover {
  background: var(--color-surface-hover);
}

.async-select__option-name {
  color: var(--color-text-primary);
  font-size: 13px;
  font-weight: 600;
}

.async-select__option-email {
  color: var(--color-text-muted);
  font-size: 12px;
}

.async-select__empty,
.async-select__loading,
.async-select__error {
  color: var(--color-text-muted);
  font-size: 12px;
  padding: 6px 4px;
}

.async-select__load-more {
  background: var(--color-surface-muted);
  border: none;
  border-radius: 8px;
  color: var(--color-text-primary);
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  padding: 8px;
}

.async-select__load-more:focus-visible {
  box-shadow: 0 0 0 3px var(--color-focus);
  outline: none;
}
</style>
