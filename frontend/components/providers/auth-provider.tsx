'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { apiFetch, getApiUrl, SESSION_TOKEN_KEY, setSessionExpiredHandler } from '@/lib/api'

export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  roles: string[]
  avatarUrl?: string | null
  university?: string | null
  major?: string | null
  emailVerified?: boolean
  emailVerificationDeadline?: string | null
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  loginWithGoogleCredential: (credential: string) => Promise<void>
  loginWithGithubCode: (code: string, redirectUri: string) => Promise<void>
  register: (fullName: string, email: string, password: string) => Promise<void>
  updateUser: (nextUser: Partial<User>) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface BackendUser {
  id: number
  fullName: string
  email: string
  avatarUrl?: string | null
  university?: string | null
  major?: string | null
  roles: string[]
  emailVerified?: boolean
  emailVerificationDeadline?: string | null
}

interface AuthResponse {
  token: string
  user: BackendUser
}

interface SessionStatusDto {
  idleMinutes: number
}

function mapUser(user: BackendUser): User {
  const roles = user.roles || []
  return {
    id: String(user.id),
    email: user.email,
    name: user.fullName,
    role: roles.includes('ADMIN') ? 'admin' : 'user',
    roles,
    avatarUrl: user.avatarUrl,
    university: user.university,
    major: user.major,
    emailVerified: user.emailVerified,
    emailVerificationDeadline: user.emailVerificationDeadline,
  }
}

async function requestAuth(path: string, body: Record<string, string>) {
  const response = await fetch(`${getApiUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    const fieldMessages = error?.fields && typeof error.fields === 'object'
      ? Object.values(error.fields).filter((message): message is string => typeof message === 'string' && message.length > 0)
      : []
    throw new Error(fieldMessages[0] || error?.message || 'Authentication failed')
  }

  return response.json() as Promise<AuthResponse>
}

function persistSession(data: AuthResponse, setUser: (user: User) => void) {
  const newUser = mapUser(data.user)
  setUser(newUser)
  localStorage.setItem('aiStudyHubUser', JSON.stringify(newUser))
  localStorage.setItem(SESSION_TOKEN_KEY, data.token)
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const idleLimitMsRef = useRef(60 * 60 * 1000)
  const lastActivityRef = useRef(Date.now())

  const logout = useCallback(() => {
    void apiFetch(`${getApiUrl()}/api/auth/logout`, { method: 'POST' }).catch(() => undefined)
    setUser(null)
    localStorage.removeItem('aiStudyHubUser')
    localStorage.removeItem(SESSION_TOKEN_KEY)
  }, [])

  useEffect(() => {
    setSessionExpiredHandler(logout)
    return () => setSessionExpiredHandler(null)
  }, [logout])

  useEffect(() => {
    async function bootstrapSession() {
      const storedUser = localStorage.getItem('aiStudyHubUser')
      const storedToken = localStorage.getItem(SESSION_TOKEN_KEY)

      if (!storedUser || !storedToken) {
        localStorage.removeItem('aiStudyHubUser')
        localStorage.removeItem(SESSION_TOKEN_KEY)
        setIsLoading(false)
        return
      }

      try {
        setUser(JSON.parse(storedUser))
        const response = await apiFetch(`${getApiUrl()}/api/auth/session`)
        if (!response.ok) {
          throw new Error('Session invalid')
        }
        const session = await response.json() as SessionStatusDto
        idleLimitMsRef.current = (session.idleMinutes ?? 60) * 60 * 1000
        lastActivityRef.current = Date.now()
      } catch {
        localStorage.removeItem('aiStudyHubUser')
        localStorage.removeItem(SESSION_TOKEN_KEY)
        setUser(null)
      } finally {
        setIsLoading(false)
      }
    }

    void bootstrapSession()
  }, [])

  useEffect(() => {
    if (!user) {
      return
    }

    const markActive = () => {
      lastActivityRef.current = Date.now()
    }

    const events: Array<keyof WindowEventMap> = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart']
    events.forEach((eventName) => window.addEventListener(eventName, markActive))

    const idleInterval = window.setInterval(() => {
      if (Date.now() - lastActivityRef.current > idleLimitMsRef.current) {
        logout()
      }
    }, 30_000)

    const heartbeatInterval = window.setInterval(() => {
      void apiFetch(`${getApiUrl()}/api/auth/session/heartbeat`, { method: 'POST' })
        .then(async (response) => {
          if (!response.ok) {
            logout()
            return
          }
          const session = await response.json() as SessionStatusDto
          idleLimitMsRef.current = (session.idleMinutes ?? 60) * 60 * 1000
          lastActivityRef.current = Date.now()
        })
        .catch(() => logout())
    }, 5 * 60 * 1000)

    return () => {
      events.forEach((eventName) => window.removeEventListener(eventName, markActive))
      window.clearInterval(idleInterval)
      window.clearInterval(heartbeatInterval)
    }
  }, [logout, user])

  const login = async (email: string, password: string) => {
    const data = await requestAuth('/api/auth/login', { email, password })
    persistSession(data, setUser)
    lastActivityRef.current = Date.now()
  }

  const loginWithGoogleCredential = async (credential: string) => {
    const data = await requestAuth('/api/auth/google', { credential })
    persistSession(data, setUser)
    lastActivityRef.current = Date.now()
  }

  const loginWithGithubCode = async (code: string, redirectUri: string) => {
    const data = await requestAuth('/api/auth/github', { code, redirectUri })
    persistSession(data, setUser)
    lastActivityRef.current = Date.now()
  }

  const register = async (fullName: string, email: string, password: string) => {
    const data = await requestAuth('/api/auth/register', { fullName, email, password })
    persistSession(data, setUser)
    lastActivityRef.current = Date.now()
  }

  const updateUser = (nextUser: Partial<User>) => {
    setUser((current) => {
      if (!current) {
        return current
      }
      const updated = { ...current, ...nextUser }
      localStorage.setItem('aiStudyHubUser', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, loginWithGoogleCredential, loginWithGithubCode, register, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
