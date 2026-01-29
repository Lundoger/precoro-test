<script setup lang="ts">
import { VueDatePicker } from '@vuepic/vue-datepicker'

export type DateRangeValue = [Date, Date] | null

type Props = {
  modelValue: DateRangeValue
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: DateRangeValue): void
}>()

const formatDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatRange = (value: Date[]) => {
  if (!value[0] || !value[1]) {
    return ''
  }
  return `From ${formatDate(value[0])} to ${formatDate(value[1])}`
}
</script>

<template>
  <div class="date-range">
    <VueDatePicker
      class="date-range__picker"
      range
      multi-calendars
      name="date-range"
      :model-value="props.modelValue"
      :enable-time-picker="false"
      :auto-apply="true"
      :formats="{ input: formatRange }"
      placeholder="From yyyy-mm-dd to yyyy-mm-dd"
      @update:model-value="emit('update:modelValue', $event as DateRangeValue)"
    />
  </div>
</template>

<style scoped lang="scss">
.date-range {
  display: inline-flex;
}

.date-range__picker {
  flex: 0 0 310px;
  width: 310px;
}

.date-range__picker :deep(.dp__main) {
  width: 100% !important;
  display: flex;
}

.date-range__picker :deep(.dp__input_wrap) {
  width: 100%;
  & > div {
    & > svg {
      padding-left: 10px;
      width: 22px;
      height: 22px;
    }
  }
}

.date-range__picker :deep(.dp__input) {
  border: 1px solid var(--color-border);
  border-radius: 10px;
  box-shadow: none;
  color: var(--color-text-primary);
  font-size: 13px;
  min-height: 44px;
  padding: 5.5px 20px 5.5px 40px;
  font-weight: 600;
  font-size: 15px;
  width: 100%;
}

.date-range__picker :deep(.dp__input:focus-visible) {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus);
}

.date-range__picker :deep(.dp__menu) {
  border-radius: 12px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.12);
}
</style>
