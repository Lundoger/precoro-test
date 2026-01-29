import { ref } from 'vue'
import { fetchData } from '@/services/precoroApi'
import type { ApprovalStep, DocumentItem } from '@/types/api'

export const useBackupApprovers = () => {
  const approvalSteps = ref<ApprovalStep[]>([])
  const documents = ref<DocumentItem[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  const load = async () => {
    isLoading.value = true
    error.value = null
    try {
      const response = await fetchData()
      approvalSteps.value = response.data.approvalSteps
      documents.value = response.data.documents
    } catch (err: unknown) {
      if (err instanceof Error) {
        error.value = err.message
      } else {
        error.value = 'An unknown error occurred'
      }
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    approvalSteps,
    documents,
    isLoading,
    error,
    load,
  }
}

