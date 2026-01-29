<script setup lang="ts">
type Props = {
  modelValue: boolean
  message: string
  type: 'success' | 'error'
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const close = () => {
  emit('update:modelValue', false)
}
</script>

<template>
  <transition name="toast-fade">
    <div v-if="props.modelValue" class="toast" role="status" aria-live="polite">
      <div class="toast__icon">
        <svg
          width="26"
          height="26"
          viewBox="0 0 26 26"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            clip-rule="evenodd"
            d="M13 2C6.92428 2 2 6.92428 2 13C2 19.0757 6.92428 24 13 24C19.0757 24 24 19.0757 24 13C24 6.92428 19.0757 2 13 2ZM0 13C0 5.81972 5.81972 0 13 0C20.1803 0 26 5.81972 26 13C26 20.1803 20.1803 26 13 26C5.81972 26 0 20.1803 0 13ZM19.0404 9.62623C19.431 10.0168 19.431 10.6499 19.0404 11.0404L12.3738 17.7071C11.9833 18.0976 11.3501 18.0976 10.9596 17.7071L6.95956 13.7071C6.56904 13.3166 6.56904 12.6834 6.95956 12.2929C7.35008 11.9024 7.98325 11.9024 8.37377 12.2929L11.6667 15.5858L17.6262 9.62623C18.0168 9.2357 18.6499 9.2357 19.0404 9.62623Z"
            fill="#3FB34F"
          />
        </svg>
      </div>
      <div class="toast__content">
        <p class="toast__content-title">{{ props.type === 'success' ? 'Success' : 'Error' }}</p>
        <p class="toast__content-message">{{ props.message }}</p>
      </div>
      <button class="toast__close" type="button" aria-label="Dismiss" @click="close">Close</button>
    </div>
  </transition>
</template>

<style scoped lang="scss">
// .toast {
//   align-items: center;
//   background: var(--color-toast-bg);
//   border-radius: 10px;
//   box-shadow: 0 10px 30px rgba(15, 23, 42, 0.15);
//   color: var(--color-toast-text);
//   display: inline-flex;
//   gap: 12px;
//   padding: 12px 16px;
// }

// .toast__close {
//   background: transparent;
//   border: none;
//   color: inherit;
//   cursor: pointer;
//   font-size: 18px;
//   line-height: 1;
// }

// .toast__close:focus-visible {
//   box-shadow: 0 0 0 3px var(--color-focus);
//   border-radius: 6px;
//   outline: none;
// }

.toast-fade-enter-active,
.toast-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.toast-fade-enter-from,
.toast-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.toast {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 4px;
  box-shadow: 3px 3px 22px 0 rgba(0, 0, 0, 0.09);
  overflow: hidden;
  &__icon {
    width: 54px;
    height: 54px;
    flex: 0 0 54px;
    border-left: 4px solid #3fb34f;
    display: flex;
    align-items: center;
    justify-content: center;
    & > svg {
      width: 26px;
      height: 26px;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 8px;
    &-title {
      font-size: 14px;
      font-weight: 700;
    }

    &-message {
      font-size: 14px;
      color: var(--color-text-muted);
    }
  }

  &__close {
    width: 49px;
    height: 54px;
    flex: 0 0 54px;
    font-size: 10px;
    line-height: 12px;
    color: var(--color-text-muted);
  }
}
</style>
