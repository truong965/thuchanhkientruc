import { createContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { userService } from '../services'
import type { AuthResponse, User } from '../services'

type AuthContextValue = {
  user: User | null
  token: string
  loading: boolean
  isAuthenticated: boolean
  login: (auth: AuthResponse) => void
  logout: () => void
  refreshMe: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type Props = {
  children: ReactNode
}

export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user')
    return raw ? (JSON.parse(raw) as User) : null
  })
  const [token, setToken] = useState<string>(() => localStorage.getItem('token') || '')
  const [loading, setLoading] = useState(true)

  const refreshMe = async () => {
    if (!token) {
      setUser(null)
      return
    }

    try {
      const me = await userService.getMe()
      setUser(me)
      localStorage.setItem('user', JSON.stringify(me))
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setToken('')
      setUser(null)
    }
  }

  useEffect(() => {
    refreshMe()
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  const login = (auth: AuthResponse) => {
    setToken(auth.token)
    setUser(auth.user)
    localStorage.setItem('token', auth.token)
    localStorage.setItem('user', JSON.stringify(auth.user))
  }

  const logout = () => {
    setToken('')
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      loading,
      isAuthenticated: Boolean(token),
      login,
      logout,
      refreshMe
    }),
    [user, token, loading]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
