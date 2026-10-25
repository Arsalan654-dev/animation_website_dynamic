import axios from 'axios'

export const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api/v1').replace(/\/$/, '')
export const TOKEN_STORAGE_KEY = 'everafter.token'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
  timeout: 30_000,
})

export function getStoredToken(): string | null {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY)
  } catch {
    return null
  }
}

export function storeToken(token: string): void {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token)
  } catch {
    // Private browsing can disable storage. The in-memory token still works.
  }
}

export function clearStoredToken(): void {
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // Ignore storage errors.
  }
}

api.interceptors.request.use((config) => {
  const token = getStoredToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !String(error.config?.url).includes('/auth/login')) {
      clearStoredToken()
      window.dispatchEvent(new CustomEvent('everafter:auth-expired'))
    }
    return Promise.reject(error)
  },
)

interface ApiErrorBody {
  message?: string
  errors?: Record<string, string[]>
}

export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined
    if (body?.message) return body.message
    if (error.code === 'ECONNABORTED') return 'The request took too long. Please try again.'
    if (!error.response) return 'Could not reach the studio API. Check your connection and API URL.'
    return `Request failed (${error.response.status}).`
  }
  if (error instanceof Error) return error.message
  return 'Something went wrong. Please try again.'
}

export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined
    if (body?.errors) {
      return Object.fromEntries(
        Object.entries(body.errors).map(([key, messages]) => [key, messages[0] ?? 'Invalid value']),
      )
    }
  }
  return {}
}

export function getApiUsages(error: unknown): Array<{ type: string; id: number; label: string }> {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as { usages?: Array<{ type: string; id: number; label: string }> } | undefined
    return body?.usages ?? []
  }
  return []
}
