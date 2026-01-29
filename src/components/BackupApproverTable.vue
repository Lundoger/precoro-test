<script setup lang="ts">
import { computed } from 'vue'
import AsyncSelect from '@/components/ui/AsyncSelect.vue'
import type { ApprovalStep, DocumentItem, Pagination, User } from '@/types/api'

type LoadResult = {
  items: User[]
  pagination: Pagination
}

type Props = {
  documents: DocumentItem[]
  steps: ApprovalStep[]
  modelValue: Record<number, User | null>
  loadUsers: (search: string, page: number) => Promise<LoadResult | null>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (event: 'update:modelValue', value: Record<number, User | null>): void
}>()

const documentNameById = computed(() => {
  const map = new Map<number, string>()
  props.documents.forEach((doc) => map.set(doc.id, doc.name))
  return map
})

type DocumentGroup = {
  documentId: number
  documentName: string
  steps: ApprovalStep[]
}

const groupedRows = computed<DocumentGroup[]>(() => {
  const stepsByDocument = new Map<number, ApprovalStep[]>()
  props.steps.forEach((step) => {
    const list = stepsByDocument.get(step.documentId) ?? []
    list.push(step)
    stepsByDocument.set(step.documentId, list)
  })

  props.documents.forEach((document) => {
    const list = stepsByDocument.get(document.id)
    if (list) {
      list.sort((a, b) => a.stepNumber - b.stepNumber)
    }
  })

  const orderedDocumentIds = props.documents.map((document) => document.id)
  return orderedDocumentIds
    .map((documentId) => ({
      documentId,
      documentName: documentNameById.value.get(documentId) ?? 'Unknown',
      steps: stepsByDocument.get(documentId) ?? [],
    }))
    .filter((group) => group.steps.length > 0)
})

const updateSelection = (stepId: number, user: User | null) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [stepId]: user,
  })
}
</script>

<template>
  <div class="backup-table">
    <div class="backup-table__table">
      <div class="backup-table__header">
        <div class="backup-table__header-cell">Document</div>
        <div class="backup-table__header-cell">Approval step</div>
        <div class="backup-table__header-cell">Backup approver</div>
      </div>
      <div class="backup-table__body">
        <div class="backup-table__group" v-for="group in groupedRows" :key="group.documentId">
          <div class="backup-table__row" v-for="(step, index) in group.steps" :key="step.id">
            <div v-if="index === 0" class="backup-table__cell--document backup-table__cell">
              {{ group.documentName }}
            </div>
            <div v-else class="backup-table__cell--document backup-table__cell is-empty"></div>
            <div class="backup-table__cell--step backup-table__cell">
              <span class="backup-table__step-number">{{ step.stepNumber }}</span>
              <span class="backup-table__step-name">{{ step.stepName }}</span>
            </div>
            <div class="backup-table__cell--approver backup-table__cell">
              <AsyncSelect
                class="backup-table__select"
                :label="`Backup approver for ${step.stepName}`"
                placeholder="Select backup approver"
                :model-value="props.modelValue[step.id] ?? null"
                :load-options="props.loadUsers"
                required
                @update:model-value="updateSelection(step.id, $event)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.backup-table {
  &__header {
    background-color: var(--color-table-bg);
    border-radius: 10px 10px 0 0;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
  }

  &__header-cell {
    padding: 5px 0 5px 16px;
    font-size: 12px;
    font-weight: 600;
    line-height: 144%;
    color: var(--color-grey);
    &:not(:last-child) {
      border-right: 1px solid rgba(29, 36, 82, 0.05);
    }
  }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  &__group {
    &:not(:first-child) {
      & > div {
        &:first-child {
          & > div {
            border-top: 1px solid rgba(29, 36, 82, 0.06);
            &:first-child {
              border-top-left-radius: 10px;
              border-bottom-left-radius: 10px;
            }
            &:last-child {
              border-top-right-radius: 10px;
            }
          }
        }
      }
    }
  }

  &__row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    min-height: 40px;
    align-items: center;
    &:last-child {
      & > div {
        border-bottom: 1px solid rgba(29, 36, 82, 0.06);
        &:first-child {
          border-bottom-left-radius: 10px;
        }
        &:last-child {
          border-bottom-right-radius: 10px;
        }
      }
    }
  }

  &__cell {
    padding: 12px 16px;
    display: flex;
    height: 100%;
    align-items: center;
    gap: 10px;
    border-bottom: 1px solid rgba(29, 36, 82, 0.06);
    border-left: 1px solid rgba(29, 36, 82, 0.06);
    &:last-child {
      border-right: 1px solid rgba(29, 36, 82, 0.06);
    }
  }

  &__cell.is-empty {
    color: transparent;
    border: none !important;
  }

  &__cell--approver {
    height: 100%;
  }

  &__select {
    width: 100%;
    height: 100%;
  }

  &__select :deep(.async-select__label) {
    display: none;
  }

  &__select :deep(.async-select__control) {
    border: none;
    background: transparent;
    min-height: 0;
    height: 100%;
    padding: 0 8px;
    box-shadow: none;
  }

  &__select :deep(.async-select__control:focus-visible) {
    box-shadow: none;
  }

  &__step-number {
    background: #2f4ebd;
    color: #fff;
    width: 22px;
    height: 22px;
    border-radius: 999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
  }

  &__step-name {
    color: var(--color-text-primary);
    font-weight: 600;
  }
}
</style>
