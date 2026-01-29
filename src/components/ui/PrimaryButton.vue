<script setup lang="ts">
type Props = {
  disabled?: boolean
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
  loading: false,
})
</script>

<template>
  <button
    class="primary-button"
    type="button"
    :disabled="props.disabled || props.loading"
    :aria-busy="props.loading"
  >
    <span class="primary-button__content">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.primary-button {
  align-items: center;
  background: var(--color-primary);
  border: none;
  border-radius: 8px;
  color: var(--color-on-primary);
  cursor: pointer;
  display: inline-flex;
  font-size: 14px;
  font-weight: 600;
  gap: 8px;
  justify-content: center;
  padding: 10px 20px;
  transition:
    background 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
}

.primary-button:focus-visible {
  box-shadow: 0 0 0 3px var(--color-focus);
  outline: none;
}

.primary-button:disabled {
  background: var(--color-primary-disabled);
  cursor: not-allowed;
  opacity: 0.7;
}

.primary-button__content {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
