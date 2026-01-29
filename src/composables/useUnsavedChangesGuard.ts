import type { Ref } from 'vue'
import { onBeforeUnmount, onMounted } from 'vue'
import type { Router } from 'vue-router'

type GuardOptions = {
  isDirty: Ref<boolean>
  router?: Router
  message?: string
}

export const useUnsavedChangesGuard = ({
  isDirty,
  router,
  message = 'You have unsaved changes. Are you sure you want to leave?',
}: GuardOptions) => {
  const onBeforeUnload = (event: BeforeUnloadEvent) => {
    if (!isDirty.value) {
      return
    }
    event.preventDefault()
  }

  let removeRouteGuard: (() => void) | null = null

  onMounted(() => {
    window.addEventListener('beforeunload', onBeforeUnload)
    if (router) {
      removeRouteGuard = router.beforeEach((to, from, next) => {
        if (!isDirty.value) {
          next()
          return
        }
        const shouldLeave = window.confirm(message)
        next(shouldLeave)
      })
    }
  })

  onBeforeUnmount(() => {
    window.removeEventListener('beforeunload', onBeforeUnload)
    if (removeRouteGuard) {
      removeRouteGuard()
    }
  })
}
