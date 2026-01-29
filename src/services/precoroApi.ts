import type {
  DataResponse,
  UpdatePayload,
  UpdateResponse,
  UsersResponse,
} from '@/types/api'

const API_BASE_URL = 'https://precoro-vuejs-test-task-api.avramch.workers.dev'

type QueryParams = Record<string, string | number | boolean | null | undefined>

const buildUrl = (path: string, params?: QueryParams) => {
  const url = new URL(path, API_BASE_URL)
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        return
      }
      url.searchParams.set(key, String(value))
    })
  }
  return url.toString()
}

const requestJson = async <TResponse>(
  input: string,
  init?: RequestInit,
): Promise<TResponse> => {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`)
  }

  return (await response.json()) as TResponse
}

export const fetchData = async () => {
  return await requestJson<DataResponse>(buildUrl('/data'))
}

export const fetchUsers = async (
  search: string,
  page: number,
  signal?: AbortSignal,
) => {
  return await requestJson<UsersResponse>(buildUrl('/users', { search, page }), {
    signal,
  })
}

export const updateVacationMode = async (payload: UpdatePayload, signal?: AbortSignal) => {
  return await requestJson<UpdateResponse>(buildUrl('/update'), {
    method: 'PATCH',
    body: JSON.stringify(payload),
    signal,
  })
}

