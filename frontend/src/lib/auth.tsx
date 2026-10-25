import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, clearStoredToken, getStoredToken, storeToken } from '@/lib/api'
import type { ApiEnvelope, LoginResponse, User } from '@/types'

interface AuthContextValue {
  user: User | null
  token: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getStoredToken())
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(Boolean(token))

  useEffect(() => {
    let cancelled = false

    if (!token) {
      setUser(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    api
      .get<ApiEnvelope<User>>('/auth/me')
      .then(({ data }) => {
        if (!cancelled) setUser(data.data)
      })
      .catch(() => {
        if (!cancelled) {
          clearStoredToken()
          setToken(null)
          setUser(null)
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    const handleExpired = () => {
      setToken(null)
      setUser(null)
      setIsLoading(false)
    }
    window.addEventListener('everafter:auth-expired', handleExpired)
    return () => window.removeEventListener('everafter:auth-expired', handleExpired)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post<ApiEnvelope<LoginResponse>>('/auth/login', { email, password })
    storeToken(data.data.token)
    setToken(data.data.token)
    setUser(data.data.user)
    return data.data.user
  }, [])

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Revoking is best-effort; always clear the local token.
    } finally {
      clearStoredToken()
      setToken(null)
      setUser(null)
    }
  }, [])

  const value = useMemo(
    () => ({ user, token, isLoading, login, logout }),
    [user, token, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
