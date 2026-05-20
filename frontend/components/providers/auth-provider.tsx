'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

export type UserRole = 'guest' | 'admin'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Demo credentials
const DEMO_ACCOUNTS = {
  'guest@example.com': { password: 'guest123', name: 'Guest User', role: 'guest' as UserRole },
  'admin@example.com': { password: 'admin123', name: 'Admin User', role: 'admin' as UserRole },
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is already logged in from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('aiStudyHubUser')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.log('[v0] Failed to parse stored user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const account = DEMO_ACCOUNTS[email as keyof typeof DEMO_ACCOUNTS]
    
    if (!account || account.password !== password) {
      throw new Error('Invalid email or password')
    }

    const newUser: User = {
      id: email.split('@')[0],
      email,
      name: account.name,
      role: account.role,
    }

    setUser(newUser)
    localStorage.setItem('aiStudyHubUser', JSON.stringify(newUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('aiStudyHubUser')
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
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
