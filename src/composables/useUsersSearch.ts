import { ref } from 'vue'
import { fetchUsers } from '@/services/precoroApi'
import type { UsersResponse } from '@/types/api'

export const useUsersSearch = () => {
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  let activeController: AbortController | null = null

  const searchUsers = async (search: string, page: number): Promise<UsersResponse | null> => {
    if (activeController) {
      activeController.abort()
    }
    const controller = new AbortController()
    activeController = controller
    isLoading.value = true
    error.value = null

    try {
      return await fetchUsers(search, page, controller.signal)
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          return null
        }
        error.value = err.message
      } else {
        error.value = 'An unknown error occurred'
      }
      throw err
    } finally {
      if (activeController === controller) {
        isLoading.value = false
      }
    }
  }

  return {
    isLoading,
    error,
    searchUsers,
  }
}

