<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import BackupApproverTable from '@/components/BackupApproverTable.vue'
import AsyncSelect from '@/components/ui/AsyncSelect.vue'
import DateRangeField, { type DateRangeValue } from '@/components/ui/DateRangeField.vue'
import PrimaryButton from '@/components/ui/PrimaryButton.vue'
import ToastNotice from '@/components/ui/ToastNotice.vue'
import { useBackupApprovers } from '@/composables/useBackupApprovers'
import { useUnsavedChangesGuard } from '@/composables/useUnsavedChangesGuard'
import { useUsersSearch } from '@/composables/useUsersSearch'
import { updateVacationMode } from '@/services/precoroApi'
import type { UpdatePayload, User } from '@/types/api'

const router = useRouter()
const { approvalSteps, documents, error, load } = useBackupApprovers()
const { searchUsers } = useUsersSearch()

const dateRange = ref<DateRangeValue>(null)
const substituteUser = ref<User | null>(null)
const backupSelections = ref<Record<number, User | null>>({})
const isSubmitting = ref(false)
const toastVisible = ref(false)
const initialSnapshot = ref('')

const loadUsers = async (search: string, page: number) => {
  const response = await searchUsers(search, page)
  if (!response) {
    return null
  }
  return {
    items: response.data,
    pagination: response.meta.pagination,
  }
}

const initializeSelections = () => {
  const map: Record<number, User | null> = {}
  approvalSteps.value.forEach((step) => {
    map[step.id] = null
  })
  backupSelections.value = map
}

const hasAllSelections = computed(() => {
  if (!approvalSteps.value.length) {
    return false
  }
  return approvalSteps.value.every((step) => backupSelections.value[step.id]?.id)
})

const isValid = computed(() => {
  if (!dateRange.value || !substituteUser.value) {
    return false
  }
  return hasAllSelections.value
})

const toUtcStartSeconds = (date: Date) => {
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 1000)
}

const buildSnapshot = () => {
  return {
    range: dateRange.value
      ? [toUtcStartSeconds(dateRange.value[0]), toUtcStartSeconds(dateRange.value[1])]
      : null,
    substituteUserId: substituteUser.value?.id ?? null,
    backupApprovers: approvalSteps.value.map((step) => ({
      id: step.id,
      backupApproverId: backupSelections.value[step.id]?.id ?? null,
    })),
  }
}

const isDirty = computed(() => {
  if (!initialSnapshot.value) {
    return false
  }
  return initialSnapshot.value !== JSON.stringify(buildSnapshot())
})

const buildPayload = (): UpdatePayload | null => {
  if (!isValid.value || !dateRange.value || !substituteUser.value) {
    return null
  }
  const [startDate, endDate] = dateRange.value
  return {
    vacationMode: {
      enable: true,
      startDate: toUtcStartSeconds(startDate),
      endDate: toUtcStartSeconds(endDate),
    },
    substituteUser: substituteUser.value.id,
    backupApprovers: approvalSteps.value.map((step) => ({
      id: step.id,
      backupApproverId: backupSelections.value[step.id]!.id,
    })),
  }
}

const submit = async () => {
  const payload = buildPayload()
  if (!payload) {
    return
  }
  isSubmitting.value = true
  try {
    const response = await updateVacationMode(payload)
    if (response.ok) {
      toastVisible.value = true
      initialSnapshot.value = JSON.stringify(buildSnapshot())
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      window.alert(error.message)
    } else {
      window.alert('An unknown error occurred')
    }
  } finally {
    isSubmitting.value = false
  }
}

useUnsavedChangesGuard({
  isDirty,
  router,
})

onMounted(async () => {
  await load()
  initializeSelections()
  initialSnapshot.value = JSON.stringify(buildSnapshot())
})

watch(toastVisible, (visible) => {
  if (!visible) {
    return
  }
  window.setTimeout(() => {
    toastVisible.value = false
  }, 3000)
})
</script>

<template>
  <header class="header">
    <div class="header__top">
      <div class="header__container header__container--top">
        <div class="header__breadcrumbs">
          <RouterLink to="/">Dashboard</RouterLink>
          <div class="header__breadcrumbs-separator">
            <svg
              width="6"
              height="10"
              viewBox="0 0 6 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill-rule="evenodd"
                clip-rule="evenodd"
                d="M0.21967 9.28033C-0.0732231 8.98744 -0.0732231 8.51256 0.21967 8.21967L3.68934 4.75L0.21967 1.28033C-0.0732231 0.987437 -0.0732231 0.512563 0.21967 0.21967C0.512563 -0.0732231 0.987437 -0.0732231 1.28033 0.21967L5.28033 4.21967C5.57322 4.51256 5.57322 4.98744 5.28033 5.28033L1.28033 9.28033C0.987437 9.57322 0.512563 9.57322 0.21967 9.28033Z"
                fill="white"
              />
            </svg>
          </div>
          <RouterLink to="/">User Management</RouterLink>
        </div>
        <div class="header__actions">
          <nav class="header__links">
            <RouterLink class="header__link" to="/buy-now">
              <svg
                width="21"
                height="20"
                viewBox="0 0 21 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M3.75 1.5C2.50736 1.5 1.5 2.50736 1.5 3.75V4H18V3.75C18 2.50736 16.9926 1.5 15.75 1.5H3.75ZM19.5 3.75C19.5 1.67893 17.8211 0 15.75 0H3.75C1.67893 0 0 1.67893 0 3.75V11.75C0 13.8211 1.67893 15.5 3.75 15.5H7.75C8.16421 15.5 8.5 15.1642 8.5 14.75C8.5 14.3358 8.16421 14 7.75 14H3.75C2.50736 14 1.5 12.9926 1.5 11.75V5.5H18V7.75C18 8.16421 18.3358 8.5 18.75 8.5C19.1642 8.5 19.5 8.16421 19.5 7.75V3.75ZM3.479 8.75C3.479 8.33579 3.81479 8 4.229 8H6.75C7.16421 8 7.5 8.33579 7.5 8.75C7.5 9.16421 7.16421 9.5 6.75 9.5H4.229C3.81479 9.5 3.479 9.16421 3.479 8.75ZM16.5785 11.6448C16.0421 11.4517 15.4551 11.4517 14.9187 11.6449L12.8856 12.3768C12.6543 12.4602 12.4999 12.6798 12.5 12.9257V15.1925C12.5 15.684 12.8572 16.2288 13.5441 16.7816C14.2012 17.3105 15.0009 17.7166 15.5234 17.9507L15.5253 17.9516C15.6682 18.0161 15.8318 18.0161 15.9747 17.9516L15.9766 17.9507C16.4995 17.7164 17.299 17.3109 17.9561 16.7824C18.6425 16.2303 19 15.6855 19 15.1925V12.9265C18.9998 12.6807 18.8456 12.4614 18.6144 12.3781L16.5785 11.6448C16.5785 11.6448 16.5785 11.6448 16.5785 11.6448ZM14.4106 10.2335C15.2755 9.92215 16.2219 9.92215 17.0867 10.2335L19.1228 10.9669C19.9485 11.2644 20.4993 12.0476 20.5 12.9253V15.1925C20.5 16.3969 19.6701 17.3287 18.8962 17.9512C18.0935 18.5969 17.1605 19.0639 16.5913 19.319C16.0564 19.5603 15.4436 19.5603 14.9087 19.319C14.3391 19.0637 13.4062 18.5961 12.6036 17.9501C11.8301 17.3276 11 16.3957 11 15.1925V12.926C11 12.926 11 12.9261 11 12.926C10.9999 12.0476 11.5507 11.2634 12.3771 10.9656L14.4106 10.2335ZM17.5303 13.2197C17.8232 13.5126 17.8232 13.9874 17.5303 14.2803L16.0303 15.7803C15.7374 16.0732 15.2626 16.0732 14.9697 15.7803L13.9697 14.7803C13.6768 14.4874 13.6768 14.0126 13.9697 13.7197C14.2626 13.4268 14.7374 13.4268 15.0303 13.7197L15.5 14.1893L16.4697 13.2197C16.7626 12.9268 17.2374 12.9268 17.5303 13.2197Z"
                  fill="white"
                />
              </svg>
              Buy now
            </RouterLink>
            <RouterLink class="header__link" to="/onboarding">
              <svg
                width="21"
                height="21"
                viewBox="0 0 21 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M5.75208 1.5C3.40372 1.5 1.5 3.40372 1.5 5.75208V13.7554C1.5 16.1038 3.40372 18.0075 5.75208 18.0075H8.75333C9.16755 18.0075 9.50333 18.3433 9.50333 18.7575C9.50333 19.1717 9.16755 19.5075 8.75333 19.5075H5.75208C2.5753 19.5075 0 16.9322 0 13.7554V5.75208C0 2.5753 2.5753 0 5.75208 0H13.7554C16.9322 0 19.5075 2.5753 19.5075 5.75208V8.75333C19.5075 9.16755 19.1717 9.50333 18.7575 9.50333C18.3433 9.50333 18.0075 9.16755 18.0075 8.75333V5.75208C18.0075 3.40372 16.1038 1.5 13.7554 1.5H5.75208ZM8.07914 6.13856C8.35633 6.44636 8.33151 6.92059 8.02371 7.19777L6.17294 8.86447C5.88761 9.12142 5.45429 9.12137 5.16902 8.86435L4.24964 8.036C3.94191 7.75874 3.91721 7.28451 4.19447 6.97678C4.47173 6.66904 4.94596 6.64434 5.25369 6.9216L5.67117 7.29774L7.01993 6.08313C7.32773 5.80595 7.80196 5.83076 8.07914 6.13856ZM10.0042 7.75292C10.0042 7.3387 10.34 7.00292 10.7542 7.00292H14.7558C15.17 7.00292 15.5058 7.3387 15.5058 7.75292C15.5058 8.16713 15.17 8.50292 14.7558 8.50292H10.7542C10.34 8.50292 10.0042 8.16713 10.0042 7.75292ZM8.07914 11.1406C8.35633 11.4484 8.33151 11.9227 8.02371 12.1999L6.17294 13.8666C5.88761 14.1235 5.45429 14.1235 5.16902 13.8664L4.24964 13.0381C3.94191 12.7608 3.91721 12.2866 4.19447 11.9789C4.47173 11.6711 4.94596 11.6464 5.25369 11.9237L5.67117 12.2998L7.01993 11.0852C7.32773 10.808 7.80196 10.8328 8.07914 11.1406ZM16.5907 11.3208C16.5906 11.3207 16.5907 11.3208 16.5907 11.3208L19.6788 12.8619C20.18 13.1118 20.4991 13.6201 20.5075 14.1787C20.5078 14.1866 20.5079 14.1946 20.5079 14.2026V16.0034C20.5079 16.4176 20.1721 16.7534 19.7579 16.7534C19.3437 16.7534 19.0079 16.4176 19.0079 16.0034V15.8764L18.4813 16.1397V18.0043C18.4813 18.0042 18.4813 18.0043 18.4813 18.0043C18.4814 18.7998 18.0319 19.5272 17.3203 19.8828L16.7982 20.1438C15.827 20.6292 14.6838 20.6293 13.7125 20.1439L13.1903 19.8828C12.4787 19.5272 12.0292 18.7999 12.0293 18.0044C12.0293 18.0044 12.0293 18.0045 12.0293 18.0044V16.1377L10.8362 15.5417C10.8357 15.5415 10.8353 15.5413 10.8349 15.5411C10.3272 15.2887 10.0056 14.7711 10.0043 14.204C10.003 13.6365 10.3228 13.1171 10.8301 12.8627L13.9139 11.3208C13.9138 11.3208 13.9139 11.3207 13.9139 11.3208C14.7562 10.8993 15.7483 10.8993 16.5907 11.3208ZM13.5293 16.887V18.0044C13.5292 18.2316 13.6576 18.4395 13.8608 18.541L14.3831 18.8021C14.9322 19.0766 15.5784 19.0766 16.1275 18.8021L16.6496 18.5411C16.8528 18.4395 16.9814 18.2318 16.9813 18.0046V16.8897L16.5964 17.0822C15.7542 17.5023 14.7629 17.5026 13.9207 17.0825L13.5293 16.887ZM17.4094 14.9986C17.4006 15.0028 17.392 15.0071 17.3835 15.0116L15.9262 15.7402C15.5056 15.95 15.0109 15.95 14.5903 15.7402L11.5082 14.2007L14.5849 12.6623C15.0048 12.4521 15.4994 12.452 15.9193 12.6621L19.0038 14.2014L17.4094 14.9986ZM11.502 14.2038L11.5001 14.2007L11.1663 13.5331L11.502 14.2038Z"
                  fill="white"
                />
              </svg>
              Onboarding
            </RouterLink>
            <RouterLink class="header__link" to="/help-center">
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M14.5653 1.27299C15.2287 0.897642 16.0932 0.985901 16.6674 1.55879L17.9411 2.83242C18.5161 3.40748 18.603 4.27243 18.2273 4.93562C19.9242 7.91925 19.923 11.5842 18.2272 14.5665C18.6017 15.2298 18.5132 16.0935 17.9407 16.6674L16.6671 17.9411C16.0924 18.5158 15.2281 18.6029 14.5651 18.228C11.5825 19.9232 7.91686 19.9239 4.93414 18.2265C4.27073 18.6019 3.40629 18.5136 2.83205 17.9407L1.55842 16.6671C0.983363 16.092 0.896533 15.2271 1.27218 14.5639C-0.424497 11.5805 -0.423495 7.91605 1.2718 4.93387C0.896673 4.2705 0.984998 3.40621 1.55779 2.83205L2.83142 1.55842C3.40627 0.98357 4.2708 0.896596 4.9339 1.27178C7.91655 -0.423764 11.5817 -0.42449 14.5653 1.27299ZM6.00965 2.39577C8.35654 1.20135 11.1425 1.20109 13.4897 2.39691L11.8572 4.38004C10.5057 3.8504 8.99452 3.85033 7.6429 4.37983L6.00965 2.39577ZM4.28122 2.65626C4.28653 2.66294 4.29193 2.6695 4.29743 2.67596L6.30958 5.12028C6.08712 5.28603 5.87389 5.46989 5.67191 5.67187C5.47004 5.87374 5.28627 6.08685 5.12059 6.30919L2.67562 4.29715C2.66933 4.29179 2.66293 4.28652 2.65642 4.28134L2.63732 4.26563C2.52296 4.17154 2.5135 3.99809 2.61956 3.8916C2.61951 3.89165 2.61961 3.89155 2.61956 3.8916L3.89208 2.61908C3.99757 2.51359 4.17068 2.52191 4.26558 2.63726L4.28122 2.65626ZM2.39584 6.00952L4.38005 7.64239C3.85054 8.99367 3.85038 10.5044 4.37954 11.8558L2.39625 13.4885C1.20107 11.1415 1.20157 8.356 2.39584 6.00952ZM2.64086 15.23C2.65884 15.2164 2.67606 15.2023 2.69251 15.1874L5.11982 13.1893C5.2857 13.412 5.46973 13.6255 5.67191 13.8276C5.87373 14.0295 6.08679 14.2132 6.30907 14.3788L4.26571 16.8611C4.17163 16.9754 3.99815 16.985 3.89165 16.879C3.89158 16.8789 3.89172 16.8791 3.89165 16.879L2.61908 15.6064C2.51359 15.5009 2.52191 15.3278 2.63726 15.2329L2.64086 15.23ZM7.79091 13.5418C7.78055 13.5361 7.77008 13.5306 7.75953 13.5254C7.39015 13.3306 7.04335 13.0778 6.73257 12.767C5.38554 11.42 5.1274 9.39638 5.95814 7.79005C5.96354 7.78025 5.9687 7.77036 5.97362 7.7604C6.16855 7.39068 6.42153 7.04357 6.73257 6.73253C8.07908 5.38601 10.1016 5.12756 11.7077 5.95716C11.7187 5.96325 11.7298 5.96904 11.741 5.97454C12.11 6.16933 12.4565 6.422 12.767 6.73253C14.1133 8.07883 14.3719 10.1009 13.5428 11.7069C13.5364 11.7184 13.5303 11.73 13.5246 11.7418C13.3298 12.1105 13.0773 12.4567 12.767 12.767C11.4202 14.1138 9.39711 14.3721 7.79091 13.5418ZM7.64228 15.1194L6.0097 17.1027C8.35606 18.2983 11.1423 18.2982 13.4891 17.1041L11.8559 15.12C10.5044 15.6492 8.99359 15.649 7.64228 15.1194ZM13.1893 14.3797L15.1865 16.8058C15.2026 16.8236 15.2181 16.8424 15.2327 16.862C15.2327 16.862 15.2328 16.862 15.2327 16.862M13.1893 14.3797C13.412 14.2138 13.6255 14.0298 13.8277 13.8276C14.0295 13.6258 14.2132 13.4128 14.3789 13.1905L16.8611 15.2338C16.9754 15.3279 16.985 15.5013 16.879 15.6078C16.879 15.6079 16.8791 15.6077 16.879 15.6078L15.6064 16.8804C15.5009 16.9859 15.3276 16.9774 15.2327 16.862M15.1195 11.8573L17.1034 13.4904C18.2979 11.1439 18.2985 8.3582 17.1032 6.01104L15.12 7.64362C15.6492 8.99506 15.6491 10.5059 15.1195 11.8573ZM14.3797 6.31016L16.807 4.31206C16.8234 4.29725 16.8407 4.28305 16.8586 4.26954L16.8621 4.26671C16.9774 4.1718 16.9859 3.99857 16.8804 3.89308L15.6081 2.62071C15.5016 2.51449 15.3281 2.52385 15.2339 2.63826L13.1905 5.12062C13.4128 5.28628 13.6258 5.47003 13.8277 5.67187C14.0298 5.87403 14.2139 6.08747 14.3797 6.31016Z"
                  fill="white"
                />
              </svg>
              Help center
            </RouterLink>
          </nav>
          <div class="header__user">user@email.com</div>
        </div>
      </div>
    </div>
    <div class="header__content">
      <div class="header__container header__container--content">
        <h1 class="header__title">Vacation Mode Settings</h1>
        <PrimaryButton :disabled="!isValid || isSubmitting" :loading="isSubmitting" @click="submit">
          Update
        </PrimaryButton>
      </div>
    </div>
  </header>

  <section class="date-section">
    <div class="date-section__container">
      <div class="date-section__content">
        <div class="date-section__header">
          <div class="date-section__header-title">
            <h3 class="date-section__title title">Vacation mode</h3>
            <div class="status-label" :class="{ 'status-label--success': isValid }">
              <span v-if="!isValid" class="status-label__text">
                <svg
                  width="8"
                  height="8"
                  viewBox="0 0 8 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0.21967 0.21967C0.512563 -0.0732232 0.987437 -0.0732232 1.28033 0.21967L3.58 2.51934L5.87967 0.21967C6.17256 -0.0732232 6.64744 -0.0732232 6.94033 0.21967C7.23322 0.512563 7.23322 0.987437 6.94033 1.28033L4.64066 3.58L6.94033 5.87967C7.23322 6.17256 7.23322 6.64744 6.94033 6.94033C6.64744 7.23322 6.17256 7.23322 5.87967 6.94033L3.58 4.64066L1.28033 6.94033C0.987437 7.23322 0.512563 7.23322 0.21967 6.94033C-0.0732232 6.64744 -0.0732232 6.17256 0.21967 5.87967L2.51934 3.58L0.21967 1.28033C-0.0732232 0.987437 -0.0732232 0.512563 0.21967 0.21967Z"
                    fill="#5E6A75"
                  />
                </svg>
                disabled
              </span>
              <span v-else class="status-label__text">
                <svg
                  width="10"
                  height="8"
                  viewBox="0 0 10 8"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3.82918 7.61526C3.73372 7.71128 3.60349 7.76485 3.46821 7.76485C3.33292 7.76485 3.20269 7.71128 3.10723 7.61526L0.224383 4.73195C-0.0747942 4.43277 -0.0747942 3.94764 0.224383 3.64902L0.585358 3.28795C0.884628 2.98878 1.3692 2.98878 1.66838 3.28795L3.46821 5.08787L8.3316 0.224383C8.63087 -0.0747942 9.11591 -0.0747942 9.41462 0.224383L9.7756 0.585451C10.0748 0.884628 10.0748 1.36967 9.7756 1.66838L3.82918 7.61526Z"
                    fill="#00A338"
                  />
                </svg>
                Enabled
              </span>
            </div>
          </div>
          <p class="date-section__description description">
            Select Date, Substitute User and Backup Approver to Enable Vacation Mode.
          </p>
        </div>
        <DateRangeField required v-model="dateRange" />
      </div>
    </div>
  </section>
  <section class="substitute-section">
    <div class="substitute-section__container">
      <div class="substitute-section__content">
        <div class="substitute-section__header">
          <h3 class="substitute-section__title title">Substitute User</h3>
          <p class="substitute-section__description description">
            Performs approval actions while you are away.
          </p>
        </div>
        <AsyncSelect
          v-model="substituteUser"
          label="Substitute user"
          placeholder="Select Substitute"
          :load-options="loadUsers"
          required
        />
      </div>
    </div>
  </section>

  <section class="approver">
    <div class="approver__container">
      <div class="approver__header">
        <h3 class="approver__title title">Backup Approver</h3>
        <p class="approver__description description">
          Performs approval actions while you are away. Below, you can select the necessary
          Approvers.
        </p>
      </div>
      <BackupApproverTable
        v-if="approvalSteps.length"
        v-model="backupSelections"
        :documents="documents"
        :steps="approvalSteps"
        :load-users="loadUsers"
      />
    </div>
  </section>

  <div v-if="error" class="page__error">{{ error }}</div>

  <div class="toast">
    <ToastNotice v-model="toastVisible" type="success" message="Updated successfully." />
  </div>
</template>

<style scoped lang="scss">
.title {
  font-size: 16px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.02em;
  color: var(--color-text-primary);
  line-height: 144%;
}

.description {
  color: var(--color-text-muted);
  font-size: 14px;
  line-height: 20px;
}

.status-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  line-height: 10px;
  color: #5e6a75;
  border-radius: 22px;
  background: var(--statuses-bg-grey);
  padding: 5px 8px;
}

.status-label--success {
  background: #e1f6e9;
  color: var(--color-success);
}

.header {
  &__container {
    &--top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 0 16px 0 24px;
    }
    &--content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      padding: 0 24px;
    }
  }

  &__top {
    color: #fff;
    padding: 4px 0 4px 0;
    background: linear-gradient(90deg, #161b40 0%, #2e3985 100%);
  }

  &__breadcrumbs {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    &-separator {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
    }
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__links {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  &__link {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 16px 4px 12px;
    & > svg {
      width: 24px;
      height: 24px;
    }
  }

  &__user {
    padding: 6.5px 16px 6.5px 44px;
  }

  &__content {
    padding: 14px 0;
    border-bottom: 1px solid var(--color-border-light);
  }

  &__title {
    font-size: 20px;
    font-weight: 700;
    line-height: 28px;
  }
}

.date-section {
  &__container {
    padding-left: 24px;
    padding-right: 24px;
  }
  &__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding-top: 24px;
    padding-bottom: 20px;
    border-bottom: 1px solid var(--color-border-light);
  }

  &__header {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  &__header-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.substitute-section {
  &__container {
    padding-left: 24px;
    padding-right: 24px;
  }
  &__content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    border-bottom: 1px solid var(--color-border-light);
    padding-top: 24px;
    padding-bottom: 20px;
  }

  &__header {
    flex: 1 1 auto;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
}

.approver {
  padding: 20px 0;
  &__container {
    padding-left: 24px;
    padding-right: 24px;
  }

  &__header {
    margin-bottom: 16px;
  }
}

.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}
</style>
