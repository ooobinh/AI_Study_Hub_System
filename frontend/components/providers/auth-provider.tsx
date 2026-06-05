'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { getApiUrl } from '@/lib/api'

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
}

interface AuthResponse {
  token: string
  user: BackendUser
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
    throw new Error(error?.message || 'Authentication failed')
  }

  return response.json() as Promise<AuthResponse>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('aiStudyHubUser')
    const storedToken = localStorage.getItem('aiStudyHubToken')
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.log('[v0] Failed to parse stored user')
        localStorage.removeItem('aiStudyHubUser')
        localStorage.removeItem('aiStudyHubToken')
      }
    } else {
      localStorage.removeItem('aiStudyHubUser')
      localStorage.removeItem('aiStudyHubToken')
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const data = await requestAuth('/api/auth/login', { email, password })
    const newUser = mapUser(data.user)

    setUser(newUser)
    localStorage.setItem('aiStudyHubUser', JSON.stringify(newUser))
    localStorage.setItem('aiStudyHubToken', data.token)
  }

  const loginWithGoogleCredential = async (credential: string) => {
    const data = await requestAuth('/api/auth/google', { credential })
    const newUser = mapUser(data.user)

    setUser(newUser)
    localStorage.setItem('aiStudyHubUser', JSON.stringify(newUser))
    localStorage.setItem('aiStudyHubToken', data.token)
  }

  const loginWithGithubCode = async (code: string, redirectUri: string) => {
    const data = await requestAuth('/api/auth/github', { code, redirectUri })
    const newUser = mapUser(data.user)

    setUser(newUser)
    localStorage.setItem('aiStudyHubUser', JSON.stringify(newUser))
    localStorage.setItem('aiStudyHubToken', data.token)
  }

  const register = async (fullName: string, email: string, password: string) => {
    const data = await requestAuth('/api/auth/register', { fullName, email, password })
    const newUser = mapUser(data.user)

    setUser(newUser)
    localStorage.setItem('aiStudyHubUser', JSON.stringify(newUser))
    localStorage.setItem('aiStudyHubToken', data.token)
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

  const logout = () => {
    setUser(null)
    localStorage.removeItem('aiStudyHubUser')
    localStorage.removeItem('aiStudyHubToken')
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
